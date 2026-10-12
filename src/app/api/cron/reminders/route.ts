import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail, sendLegacyAccessGrantedEmail, type DigestItem } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { logAudit } from "@/lib/audit";
import { startOfTodayFor, addDays } from "@/lib/timezone";

const TRASH_RETENTION_DAYS = 30;

// Soft-deleted people/assets/accounts/tasks/documents older than the
// retention window get actually removed - documents' blob files are
// deleted here too, since the delete action deliberately keeps them around
// until this point so a restore has something to restore.
async function purgeOldSoftDeletes() {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const where = { deletedAt: { lt: cutoff } };

  const documents = await prisma.document.findMany({ where, select: { id: true, fileUrl: true } });
  for (const doc of documents) {
    await del(doc.fileUrl).catch(() => {});
  }

  await Promise.all([
    prisma.document.deleteMany({ where }),
    prisma.task.deleteMany({ where }),
    prisma.account.deleteMany({ where }),
    prisma.asset.deleteMany({ where }),
    prisma.person.deleteMany({ where }),
  ]);
}

function dueLabel(dueDate: Date, today: Date) {
  const due = new Date(dueDate);
  due.setUTCHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "due today";
  if (diffDays === 1) return "due tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  return `due in ${diffDays}d`;
}

// Everything here only ever accumulates (rate-limit bookkeeping, expired
// one-time tokens) - nothing else reads old rows, so a day-old cutoff is
// safe even though the windows themselves are much shorter (max 60 min).
async function cleanupExpiredRows() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const now = new Date();

  await Promise.all([
    prisma.rateLimitAttempt.deleteMany({ where: { createdAt: { lt: dayAgo } } }),
    prisma.pendingTwoFactor.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] } }),
    prisma.invite.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { acceptedAt: { not: null } }] } }),
  ]);
}

// Called by the daily cron too - any pending emergency access request past
// its wait period and not cancelled becomes a real (non-admin) member.
// Skips (and leaves pending, to retry tomorrow) if the contact's email
// already belongs to some account - rare, but creating it would violate
// the unique email constraint anyway.
async function grantDueLegacyAccess() {
  const dueRequests = await prisma.legacyAccessRequest.findMany({
    where: { status: "pending", grantAt: { lte: new Date() } },
    include: { link: { include: { household: { select: { id: true, name: true } } } } },
  });

  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  for (const request of dueRequests) {
    const existingUser = await prisma.user.findUnique({ where: { email: request.link.contactEmail } });
    if (existingUser) {
      console.error(`Legacy access grant skipped - ${request.link.contactEmail} already has an account`);
      continue;
    }

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: request.link.contactName,
          email: request.link.contactEmail,
          passwordHash: crypto.randomUUID(), // unusable until set via the reset link below
          householdId: request.link.householdId,
        },
      });
      await tx.legacyAccessRequest.update({ where: { id: request.id }, data: { status: "granted", grantedAt: new Date() } });
      return created;
    });

    const resetToken = await prisma.passwordResetToken.create({
      data: { token: crypto.randomUUID(), userId: newUser.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });

    await sendLegacyAccessGrantedEmail({
      to: newUser.email,
      contactName: newUser.name,
      householdName: request.link.household.name,
      setPasswordUrl: `${appUrl}/reset-password/${resetToken.token}`,
    }).catch((err) => console.error("Failed to send legacy access granted email:", err));

    await logAudit({
      householdId: request.link.householdId,
      userId: newUser.id,
      userName: newUser.name,
      action: "member_joined",
      category: "member",
      entityLabel: newUser.name,
      detail: "via emergency access",
    });
  }
}

// Triggered daily by Vercel Cron (see vercel.json). Sends each household
// member a digest of what's overdue/due this week, mirroring the dashboard's
// "This week" section - re-sent daily for as long as it's still true, rather
// than tracked per-reminder, so there's no extra state to keep in sync.
// Also doubles as daily housekeeping, pruning rows that only ever accumulate.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanupExpiredRows().catch((err) => console.error("Cron cleanup failed:", err));
  await grantDueLegacyAccess().catch((err) => console.error("Legacy access grant failed:", err));
  await purgeOldSoftDeletes().catch((err) => console.error("Trash purge failed:", err));

  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const households = await prisma.household.findMany({
    select: {
      id: true,
      name: true,
      members: { select: { id: true, email: true, name: true, timezone: true } },
      // Open-ended on purpose: household members can be in different
      // timezones, so "overdue"/"due this week" is computed per member
      // below, not once per household - fetching everything OPEN avoids
      // a DB-side date filter that'd be wrong for whoever isn't in UTC.
      tasks: {
        // Nested relation fetches bypass the soft-delete query extension
        // (it only intercepts top-level prisma.task.* calls), so deletedAt
        // needs to be excluded explicitly here.
        where: { status: "OPEN", deletedAt: null },
        select: { title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      },
      documents: { where: { status: "PENDING_REVIEW", deletedAt: null }, select: { id: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const household of households) {
    const pendingDocuments = household.documents.length;

    for (const member of household.members) {
      const today = startOfTodayFor(member.timezone);
      const weekEnd = addDays(today, 7);

      const overdueItems: DigestItem[] = [];
      const dueThisWeekItems: DigestItem[] = [];
      for (const task of household.tasks) {
        if (task.dueDate >= weekEnd) continue;
        const item: DigestItem = { title: task.title, dueLabel: dueLabel(task.dueDate, today), overdue: task.dueDate < today };
        (item.overdue ? overdueItems : dueThisWeekItems).push(item);
      }

      if (overdueItems.length === 0 && dueThisWeekItems.length === 0 && pendingDocuments === 0) {
        continue;
      }

      const totalCount = overdueItems.length + dueThisWeekItems.length;

      const result = await sendDigestEmail({
        to: member.email,
        recipientName: member.name,
        householdName: household.name,
        overdueItems,
        dueThisWeekItems,
        pendingDocuments,
        dashboardUrl: `${appUrl}/dashboard`,
      });

      if ("skipped" in result) {
        skipped++;
      } else if (result.error) {
        failures.push(`${member.email}: ${result.error.message}`);
      } else {
        sent++;
      }

      const bodyParts = [
        overdueItems.length > 0 && `${overdueItems.length} overdue`,
        dueThisWeekItems.length > 0 && `${dueThisWeekItems.length} due this week`,
        pendingDocuments > 0 && `${pendingDocuments} document${pendingDocuments === 1 ? "" : "s"} to review`,
      ].filter(Boolean);

      await sendPushToUser(member.id, {
        title: `${household.name}: ${totalCount} thing${totalCount === 1 ? "" : "s"} due this week`,
        body: bodyParts.join(" · "),
        url: `${appUrl}/dashboard`,
      }).catch((err) => console.error(`Push to ${member.email} failed:`, err));
    }
  }

  return NextResponse.json({ sent, skipped, failed: failures.length, failures });
}

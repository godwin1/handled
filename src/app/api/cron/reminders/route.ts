import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDigestEmail, type DigestItem } from "@/lib/email";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dueLabel(dueDate: Date, today: Date) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
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

  const today = startOfToday();
  const weekEnd = addDays(today, 7);
  const appUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const households = await prisma.household.findMany({
    select: {
      id: true,
      name: true,
      members: { select: { email: true, name: true } },
      tasks: {
        where: { status: "OPEN", dueDate: { lt: weekEnd } },
        select: { title: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      },
      documents: { where: { status: "PENDING_REVIEW" }, select: { id: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const household of households) {
    const overdueItems: DigestItem[] = [];
    const dueThisWeekItems: DigestItem[] = [];

    for (const task of household.tasks) {
      const item: DigestItem = { title: task.title, dueLabel: dueLabel(task.dueDate, today), overdue: task.dueDate < today };
      (item.overdue ? overdueItems : dueThisWeekItems).push(item);
    }

    const pendingDocuments = household.documents.length;
    if (overdueItems.length === 0 && dueThisWeekItems.length === 0 && pendingDocuments === 0) {
      continue;
    }

    for (const member of household.members) {
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
    }
  }

  return NextResponse.json({ sent, skipped, failed: failures.length, failures });
}

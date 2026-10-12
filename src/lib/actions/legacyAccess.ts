"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendLegacyAccessRequestedEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/url";

const MIN_WAIT_DAYS = 3;
const MAX_WAIT_DAYS = 90;

export async function createLegacyAccessLink(
  _prevState: { link?: string; error?: string } | undefined,
  formData: FormData
): Promise<{ link?: string; error?: string }> {
  const user = await requireUser();
  requireAdmin(user);

  const contactName = String(formData.get("contactName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim().toLowerCase();
  if (!contactName || !contactEmail) {
    return { error: "Please fill in both fields." };
  }

  const link = await prisma.legacyAccessLink.create({
    data: { token: crypto.randomUUID(), contactName, contactEmail, householdId: user.householdId, createdByUserId: user.id },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "household",
    entityLabel: `emergency access link for ${contactName}`,
  });

  revalidatePath("/household/emergency-access");

  const origin = await currentOrigin();
  return { link: `${origin}/legacy-access/${link.token}` };
}

export async function revokeLegacyAccessLink(linkId: string) {
  const user = await requireUser();
  requireAdmin(user);

  const link = await prisma.legacyAccessLink.findFirst({ where: { id: linkId, householdId: user.householdId } });
  if (!link) return;

  await prisma.legacyAccessLink.delete({ where: { id: linkId } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "household",
    entityLabel: `emergency access link for ${link.contactName}`,
  });

  revalidatePath("/household/emergency-access");
}

export async function setLegacyAccessWaitDays(formData: FormData) {
  const user = await requireUser();
  requireAdmin(user);

  const raw = Number(formData.get("waitDays"));
  const waitDays = Math.min(MAX_WAIT_DAYS, Math.max(MIN_WAIT_DAYS, Number.isFinite(raw) ? Math.round(raw) : MIN_WAIT_DAYS));

  await prisma.household.update({ where: { id: user.householdId }, data: { legacyAccessMinWaitDays: waitDays } });
  revalidatePath("/household/emergency-access");
}

// Public - called by whoever holds the link, who isn't a household member
// and has no account. Idempotent: calling it again while a request is
// already pending just reports that request's status instead of spamming
// a new one.
export async function requestLegacyAccess(token: string): Promise<{ grantAt?: Date; error?: string; alreadyGranted?: boolean }> {
  const link = await prisma.legacyAccessLink.findUnique({
    where: { token },
    include: { household: { select: { id: true, name: true, legacyAccessMinWaitDays: true } } },
  });
  if (!link) return { error: "This link is no longer valid." };

  const existing = await prisma.legacyAccessRequest.findFirst({
    where: { linkId: link.id, status: { in: ["pending", "granted"] } },
    orderBy: { requestedAt: "desc" },
  });
  if (existing) {
    if (existing.status === "granted") return { alreadyGranted: true };
    return { grantAt: existing.grantAt };
  }

  const grantAt = new Date(Date.now() + link.household.legacyAccessMinWaitDays * 24 * 60 * 60 * 1000);
  const request = await prisma.legacyAccessRequest.create({
    data: { linkId: link.id, grantAt, cancelToken: crypto.randomUUID() },
  });

  const admins = await prisma.user.findMany({ where: { householdId: link.household.id, isAdmin: true } });
  const origin = await currentOrigin();

  await Promise.all(
    admins.map((admin) =>
      sendLegacyAccessRequestedEmail({
        to: admin.email,
        adminName: admin.name,
        householdName: link.household.name,
        contactName: link.contactName,
        grantAt,
        cancelUrl: `${origin}/legacy-access/cancel/${request.cancelToken}`,
      }).catch((err) => console.error("Failed to send legacy access request email:", err))
    )
  );

  await logAudit({
    householdId: link.household.id,
    userId: link.createdByUserId,
    userName: "System",
    action: "updated",
    category: "household",
    entityLabel: `emergency access requested by ${link.contactName}`,
    detail: `grants ${grantAt.toLocaleDateString()} unless cancelled`,
  });

  return { grantAt };
}

// Public - the whole point is any admin can stop this without needing to
// log in, since the scenario this guards against is the usual admin being
// unreachable.
export async function cancelLegacyAccessRequest(cancelToken: string): Promise<{ cancelled: boolean }> {
  const request = await prisma.legacyAccessRequest.findUnique({ where: { cancelToken }, include: { link: true } });
  if (!request || request.status !== "pending") return { cancelled: false };

  await prisma.legacyAccessRequest.update({ where: { id: request.id }, data: { status: "cancelled" } });

  await logAudit({
    householdId: request.link.householdId,
    userId: request.link.createdByUserId,
    userName: "System",
    action: "updated",
    category: "household",
    entityLabel: `emergency access request from ${request.link.contactName} cancelled`,
  });

  return { cancelled: true };
}

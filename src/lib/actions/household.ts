"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSession, hashPassword } from "@/lib/auth";
import { requireAdmin, type Category } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const INVITE_DAYS = 7;

export async function createInvite(
  _prevState: { token?: string; error?: string } | undefined,
  formData: FormData
): Promise<{ token: string } | { error: string }> {
  const user = await requireUser();
  const email = String(formData.get("email") || "").trim().toLowerCase() || null;

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "That email already has an account." };
    }
  }

  const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      token: crypto.randomUUID(),
      email,
      expiresAt,
      householdId: user.householdId,
      invitedByUserId: user.id,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "invite_created",
    category: "member",
    entityLabel: email ?? "open invite",
  });

  revalidatePath("/household");
  return { token: invite.token };
}

export async function revokeInvite(id: string) {
  const user = await requireUser();
  const invite = await prisma.invite.findFirst({ where: { id, householdId: user.householdId, acceptedAt: null } });
  if (!invite) return;

  await prisma.invite.deleteMany({ where: { id, householdId: user.householdId, acceptedAt: null } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "invite_revoked",
    category: "member",
    entityLabel: invite.email ?? "open invite",
  });

  revalidatePath("/household");
}

export async function acceptInvite(
  token: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !password || password.length < 8) {
    return { error: "Please fill in all fields. Password must be at least 8 characters." };
  }

  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { error: "This invite link is no longer valid." };
  }

  const email = invite.email ?? String(formData.get("email") || "").trim().toLowerCase();
  if (!email) {
    return { error: "Please enter an email address." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists. Log in instead." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        householdId: invite.householdId,
      },
    });
    await tx.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
    return created;
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "member_joined",
    category: "member",
    entityLabel: user.name,
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function setMemberAdmin(targetUserId: string, makeAdmin: boolean) {
  const user = await requireUser();
  requireAdmin(user);

  const target = await prisma.user.findFirst({ where: { id: targetUserId, householdId: user.householdId } });
  if (!target) return;

  if (!makeAdmin) {
    const adminCount = await prisma.user.count({ where: { householdId: user.householdId, isAdmin: true } });
    if (adminCount <= 1) return; // never leave the household with zero admins
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { isAdmin: makeAdmin } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "member_admin_changed",
    category: "member",
    entityLabel: target.name,
    detail: makeAdmin ? "made admin" : "removed admin",
  });

  revalidatePath("/household");
}

export async function setMemberPermission(targetUserId: string, category: Category, formData: FormData) {
  const user = await requireUser();
  requireAdmin(user);

  const level = String(formData.get("level") || "edit");

  const target = await prisma.user.findFirst({ where: { id: targetUserId, householdId: user.householdId } });
  if (!target) return;

  await prisma.memberPermission.upsert({
    where: { userId_category: { userId: targetUserId, category } },
    create: { userId: targetUserId, category, level },
    update: { level },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "member_permission_changed",
    category: "member",
    entityLabel: target.name,
    detail: `${category}: ${level}`,
  });

  revalidatePath("/household");
}

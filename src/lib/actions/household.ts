"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSession, hashPassword } from "@/lib/auth";

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

  revalidatePath("/household");
  return { token: invite.token };
}

export async function revokeInvite(id: string) {
  const user = await requireUser();
  await prisma.invite.deleteMany({ where: { id, householdId: user.householdId, acceptedAt: null } });
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

  await createSession(user.id);
  redirect("/dashboard");
}

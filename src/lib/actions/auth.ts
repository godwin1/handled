"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/url";

const RESET_TOKEN_HOURS = 1;

export async function signUp(_prevState: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const householdName = String(formData.get("householdName") || "").trim();

  if (!name || !email || !password || password.length < 8) {
    return { error: "Please fill in all fields. Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isAdmin: true, // household creator starts as its admin
      household: {
        create: { name: householdName || `${name}'s household` },
      },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logIn(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logOut() {
  await destroySession();
  redirect("/login");
}

// Always returns the same generic message regardless of whether the email
// matches an account, so this can't be used to enumerate registered emails.
export async function requestPasswordReset(_prevState: { sent?: boolean } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000);
    const resetToken = await prisma.passwordResetToken.create({
      data: { token: crypto.randomUUID(), userId: user.id, expiresAt },
    });

    const origin = await currentOrigin();
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl: `${origin}/reset-password/${resetToken.token}`,
    });
  }

  return { sent: true };
}

export async function resetPassword(
  token: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const password = String(formData.get("password") || "");
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is no longer valid. Request a new one." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    // Resetting a password is a signal the old credential may be compromised
    // - kill every existing session rather than leaving them valid.
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  redirect("/login");
}

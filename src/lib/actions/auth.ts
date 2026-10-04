"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { createSession, destroySession, hashPassword, verifyPassword, createPendingTwoFactor } from "@/lib/auth";
import { sendPasswordResetEmail, sendLoginAlertEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/url";
import { getClientIp, isRateLimited, recordAttempt } from "@/lib/rateLimit";

const RESET_TOKEN_HOURS = 1;

export async function signUp(_prevState: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const householdName = String(formData.get("householdName") || "").trim();

  const ip = await getClientIp();
  if (await isRateLimited(`signup:${ip}`, 5, 60)) {
    return { error: "Too many accounts created from this connection. Please try again later." };
  }
  await recordAttempt(`signup:${ip}`);

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

  const ip = await getClientIp();
  const rateLimitKey = `login:${ip}:${email}`;
  if (await isRateLimited(rateLimitKey, 10, 15)) {
    return { error: "Too many failed attempts. Please wait a few minutes and try again." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordAttempt(rateLimitKey);
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordAttempt(rateLimitKey);
    return { error: "Invalid email or password." };
  }

  if (user.totpEnabled) {
    await createPendingTwoFactor(user.id);
    redirect("/login/verify");
  }

  await alertOnNewIp(user.id, user.email, user.name, ip);
  await createSession(user.id);
  redirect("/dashboard");
}

// Fire-and-forget: only emails when this IP has no prior session for the
// user, so logging in repeatedly from home doesn't generate repeat alerts.
// Never blocks or fails the login itself.
async function alertOnNewIp(userId: string, email: string, name: string, ip: string) {
  try {
    const priorFromThisIp = await prisma.session.findFirst({ where: { userId, ipAddress: ip } });
    if (priorFromThisIp) return;

    const h = await headers();
    await sendLoginAlertEmail({
      to: email,
      recipientName: name,
      ipAddress: ip,
      userAgent: h.get("user-agent") ?? "unknown device",
      when: new Date(),
    });
  } catch (err) {
    console.error("Failed to send login alert email:", err);
  }
}

export async function logOut() {
  await destroySession();
  redirect("/login");
}

// Always returns the same generic message regardless of whether the email
// matches an account, so this can't be used to enumerate registered emails.
export async function requestPasswordReset(_prevState: { sent?: boolean } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  const rateLimitKey = `reset:${email}`;
  if (await isRateLimited(rateLimitKey, 3, 15)) {
    // Same generic response as success - don't reveal that a limit exists
    // for this address, same enumeration-avoidance reasoning as below.
    return { sent: true };
  }
  await recordAttempt(rateLimitKey);

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

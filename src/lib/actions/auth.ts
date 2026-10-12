"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword, createPendingTwoFactor } from "@/lib/auth";
import { sendPasswordResetEmail, sendLoginAlertEmail, sendVerificationEmail } from "@/lib/email";
import { currentOrigin } from "@/lib/url";
import { getClientIp, isRateLimited, recordAttempt } from "@/lib/rateLimit";
import { isValidTimezone } from "@/lib/timezone";
import { logAudit } from "@/lib/audit";

const RESET_TOKEN_HOURS = 1;
const VERIFICATION_TOKEN_HOURS = 24;

// Fire-and-forget, like alertOnNewIp below - verification is informational
// (see User.emailVerifiedAt), never blocks signup/resend if Resend is down.
async function sendVerification(userId: string, email: string) {
  try {
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000);
    const token = await prisma.emailVerificationToken.create({
      data: { token: crypto.randomUUID(), userId, expiresAt },
    });
    const origin = await currentOrigin();
    await sendVerificationEmail({ to: email, verifyUrl: `${origin}/verify-email/${token.token}` });
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }
}

export async function signUp(_prevState: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const householdName = String(formData.get("householdName") || "").trim();
  const timezoneRaw = String(formData.get("timezone") || "");
  const timezone = isValidTimezone(timezoneRaw) ? timezoneRaw : null;

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
      timezone,
      isAdmin: true, // household creator starts as its admin
      household: {
        create: { name: householdName || `${name}'s household` },
      },
    },
  });

  await createSession(user.id);
  await sendVerification(user.id, user.email);
  redirect("/dashboard");
}

export async function logIn(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const timezoneRaw = String(formData.get("timezone") || "");
  const timezone = isValidTimezone(timezoneRaw) ? timezoneRaw : null;

  const ip = await getClientIp();
  // Two layers: per-IP+email catches someone hammering one account, the
  // higher per-IP-only threshold catches credential stuffing spread across
  // many different email addresses from the same connection.
  const ipKey = `login-ip:${ip}`;
  const emailKey = `login:${ip}:${email}`;
  if ((await isRateLimited(ipKey, 30, 15)) || (await isRateLimited(emailKey, 10, 15))) {
    return { error: "Too many failed attempts. Please wait a few minutes and try again." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordAttempt(ipKey);
    await recordAttempt(emailKey);
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await recordAttempt(ipKey);
    await recordAttempt(emailKey);
    await logAudit({
      householdId: user.householdId,
      userId: user.id,
      userName: user.name,
      action: "login_failed",
      category: "member",
      entityLabel: ip,
    });
    return { error: "Invalid email or password." };
  }

  // Keeps it current if the person travels or switches devices - cheap
  // enough to do on every login rather than only once at signup.
  if (timezone && timezone !== user.timezone) {
    await prisma.user.update({ where: { id: user.id }, data: { timezone } });
  }

  if (user.totpEnabled) {
    await createPendingTwoFactor(user.id);
    redirect("/login/verify");
  }

  await alertOnNewIp(user.id, user.email, user.name, ip);
  await createSession(user.id);

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "login_succeeded",
    category: "member",
    entityLabel: ip,
  });

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
  const user = await getCurrentUser();
  if (user) {
    await logAudit({
      householdId: user.householdId,
      userId: user.id,
      userName: user.name,
      action: "logged_out",
      category: "member",
      entityLabel: "",
    });
  }
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

export async function verifyEmail(token: string): Promise<{ error?: string }> {
  const verificationToken = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt < new Date()) {
    return { error: "This verification link is no longer valid. Request a new one from your account page." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: verificationToken.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } }),
  ]);

  return {};
}

export async function resendVerificationEmail(): Promise<{ sent?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Log in first." };
  if (user.emailVerifiedAt) return { error: "Your email is already verified." };

  const rateLimitKey = `verify-resend:${user.id}`;
  if (await isRateLimited(rateLimitKey, 3, 15)) {
    return { error: "Please wait a few minutes before requesting another email." };
  }
  await recordAttempt(rateLimitKey);

  await sendVerification(user.id, user.email);
  return { sent: true };
}

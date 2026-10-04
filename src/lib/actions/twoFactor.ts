"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, verifyPassword, createSession, getPendingTwoFactorUser, clearPendingTwoFactor } from "@/lib/auth";
import {
  encryptSecret,
  decryptSecret,
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from "@/lib/totp";
import { isRateLimited, recordAttempt, getClientIp } from "@/lib/rateLimit";

// Generates and stores a new secret but leaves totpEnabled false - it only
// flips on once confirmEnrollment verifies a real code, so a half-finished
// setup can never lock someone out of their own account.
export async function startEnrollment() {
  const user = await requireUser();
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: encryptSecret(secret), totpEnabled: false },
  });
  redirect("/account/2fa/enroll");
}

export async function cancelEnrollment() {
  const user = await requireUser();
  if (!user.totpEnabled) {
    await prisma.user.update({ where: { id: user.id }, data: { totpSecret: null } });
  }
  redirect("/account");
}

export async function confirmEnrollment(
  _prevState: { error?: string; backupCodes?: string[] } | undefined,
  formData: FormData
): Promise<{ error?: string; backupCodes?: string[] }> {
  const user = await requireUser();
  if (!user.totpSecret) {
    return { error: "Start enrollment again." };
  }

  const code = String(formData.get("code") || "").trim();
  const secret = decryptSecret(user.totpSecret);
  if (!verifyTotpCode(secret, code)) {
    return { error: "That code didn't match. Check the time on your phone and try again." };
  }

  const backupCodes = generateBackupCodes();
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } }),
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
    prisma.backupCode.createMany({
      data: await Promise.all(backupCodes.map(async (c) => ({ userId: user.id, codeHash: await hashBackupCode(c) }))),
    }),
  ]);

  revalidatePath("/account");
  return { backupCodes };
}

export async function disableTwoFactor(_prevState: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser();
  const password = String(formData.get("password") || "");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Incorrect password." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { totpEnabled: false, totpSecret: null } }),
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
  ]);

  revalidatePath("/account");
  return {};
}

export async function regenerateBackupCodes(): Promise<{ backupCodes: string[] } | { error: string }> {
  const user = await requireUser();
  if (!user.totpEnabled) {
    return { error: "Enable two-factor authentication first." };
  }

  const backupCodes = generateBackupCodes();
  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId: user.id } }),
    prisma.backupCode.createMany({
      data: await Promise.all(backupCodes.map(async (c) => ({ userId: user.id, codeHash: await hashBackupCode(c) }))),
    }),
  ]);

  revalidatePath("/account");
  return { backupCodes };
}

export async function verifyLoginCode(_prevState: { error?: string } | undefined, formData: FormData) {
  const pending = await getPendingTwoFactorUser();
  if (!pending) {
    return { error: "Your sign-in attempt expired. Log in again." };
  }

  const ip = await getClientIp();
  const rateLimitKey = `2fa:${ip}:${pending.userId}`;
  if (await isRateLimited(rateLimitKey, 10, 15)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const code = String(formData.get("code") || "").trim();
  const user = pending.user;

  let valid = false;
  if (user.totpSecret && verifyTotpCode(decryptSecret(user.totpSecret), code)) {
    valid = true;
  } else {
    const backupCodes = await prisma.backupCode.findMany({ where: { userId: user.id, usedAt: null } });
    for (const backup of backupCodes) {
      if (await verifyBackupCode(code, backup.codeHash)) {
        await prisma.backupCode.update({ where: { id: backup.id }, data: { usedAt: new Date() } });
        valid = true;
        break;
      }
    }
  }

  if (!valid) {
    await recordAttempt(rateLimitKey);
    return { error: "Invalid code. You can also use one of your backup codes." };
  }

  await clearPendingTwoFactor();
  await createSession(user.id);
  redirect("/dashboard");
}

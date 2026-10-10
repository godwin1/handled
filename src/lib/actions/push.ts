"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function sendTestPush(): Promise<{ sent: number; skipped: boolean }> {
  const user = await requireUser();
  return sendPushToUser(user.id, {
    title: "Test notification",
    body: "If you can see this, push notifications are working.",
  });
}

export async function registerPushToken(token: string, platform: string) {
  const user = await requireUser();
  if (!token || (platform !== "android" && platform !== "ios")) return;

  // A token can outlive a logout/login as a different user on the same
  // device (e.g. switching accounts) - upsert by token, not by
  // (userId, token), so it always points at whoever is signed in now.
  await prisma.pushToken.upsert({
    where: { token },
    create: { token, platform, userId: user.id },
    update: { userId: user.id, platform },
  });
}

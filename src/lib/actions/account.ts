"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentSessionId } from "@/lib/auth";

export async function revokeSession(sessionId: string) {
  const user = await requireUser();
  await prisma.session.deleteMany({ where: { id: sessionId, userId: user.id } });
  revalidatePath("/account");
}

export async function revokeAllOtherSessions() {
  const user = await requireUser();
  const currentId = await getCurrentSessionId();
  await prisma.session.deleteMany({
    where: { userId: user.id, id: currentId ? { not: currentId } : undefined },
  });
  revalidatePath("/account");
}

"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { currentOrigin } from "@/lib/url";

export async function getOrCreateCalendarUrl(): Promise<string> {
  const user = await requireUser();
  const origin = await currentOrigin();

  let token = user.household.calendarToken;
  if (!token) {
    token = crypto.randomUUID();
    await prisma.household.update({ where: { id: user.householdId }, data: { calendarToken: token } });
  }

  return `${origin}/api/calendar/${token}/feed.ics`;
}

export async function regenerateCalendarUrl(): Promise<string> {
  const user = await requireUser();
  const origin = await currentOrigin();

  const token = crypto.randomUUID();
  await prisma.household.update({ where: { id: user.householdId }, data: { calendarToken: token } });

  revalidatePath("/household/calendar");
  return `${origin}/api/calendar/${token}/feed.ics`;
}

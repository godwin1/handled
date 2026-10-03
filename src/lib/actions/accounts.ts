"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function createAccount(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const provider = String(formData.get("provider") || "").trim();
  const type = String(formData.get("type") || "other");
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;

  if (!name) return;

  await prisma.account.create({
    data: {
      name,
      provider: provider || null,
      type,
      personId,
      assetId,
      householdId: user.householdId,
    },
  });

  revalidatePath("/accounts");
}

export async function deleteAccount(id: string) {
  const user = await requireUser();
  await prisma.account.deleteMany({ where: { id, householdId: user.householdId } });
  revalidatePath("/accounts");
}

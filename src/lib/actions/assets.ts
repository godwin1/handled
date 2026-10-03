"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function createAsset(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "other");
  const details = String(formData.get("details") || "").trim();
  const ownerId = String(formData.get("ownerId") || "") || null;

  if (!name) return;

  await prisma.asset.create({
    data: {
      name,
      type,
      details: details || null,
      ownerId,
      householdId: user.householdId,
    },
  });

  revalidatePath("/assets");
}

export async function deleteAsset(id: string) {
  const user = await requireUser();
  await prisma.asset.deleteMany({ where: { id, householdId: user.householdId } });
  revalidatePath("/assets");
}

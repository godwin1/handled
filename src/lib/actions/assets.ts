"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function createAsset(formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "assets");
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

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "assets",
    entityLabel: name,
  });

  revalidatePath("/assets");
}

export async function updateAsset(id: string, formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "assets");
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "other");
  const details = String(formData.get("details") || "").trim();
  const ownerId = String(formData.get("ownerId") || "") || null;

  if (!name) return;

  await prisma.asset.updateMany({
    where: { id, householdId: user.householdId },
    data: { name, type, details: details || null, ownerId },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "assets",
    entityLabel: name,
  });

  revalidatePath("/assets");
  redirect("/assets");
}

export async function deleteAsset(id: string) {
  const user = await requireUser();
  requireEdit(user, "assets");

  const asset = await prisma.asset.findFirst({ where: { id, householdId: user.householdId } });
  if (!asset) return;

  await prisma.asset.deleteMany({ where: { id, householdId: user.householdId } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "assets",
    entityLabel: asset.name,
  });

  revalidatePath("/assets");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const BILLING_CYCLES = ["weekly", "monthly", "yearly", "one_time"];

export async function createAccount(formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "accounts");
  const name = String(formData.get("name") || "").trim();
  const provider = String(formData.get("provider") || "").trim();
  const type = String(formData.get("type") || "other");
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const amountRaw = String(formData.get("amount") || "");
  const currency = String(formData.get("currency") || "").trim();
  const billingCycleRaw = String(formData.get("billingCycle") || "");
  const billingCycle = BILLING_CYCLES.includes(billingCycleRaw) ? billingCycleRaw : null;

  if (!name) return;

  await prisma.account.create({
    data: {
      name,
      provider: provider || null,
      type,
      personId,
      assetId,
      amount: amountRaw ? Number(amountRaw) : null,
      currency: currency || null,
      billingCycle: amountRaw ? billingCycle : null,
      householdId: user.householdId,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "accounts",
    entityLabel: name,
  });

  revalidatePath("/accounts");
}

export async function updateAccount(id: string, formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "accounts");
  const name = String(formData.get("name") || "").trim();
  const provider = String(formData.get("provider") || "").trim();
  const type = String(formData.get("type") || "other");
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const amountRaw = String(formData.get("amount") || "");
  const currency = String(formData.get("currency") || "").trim();
  const billingCycleRaw = String(formData.get("billingCycle") || "");
  const billingCycle = BILLING_CYCLES.includes(billingCycleRaw) ? billingCycleRaw : null;

  if (!name) return;

  await prisma.account.updateMany({
    where: { id, householdId: user.householdId },
    data: {
      name,
      provider: provider || null,
      type,
      personId,
      assetId,
      amount: amountRaw ? Number(amountRaw) : null,
      currency: currency || null,
      billingCycle: amountRaw ? billingCycle : null,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "accounts",
    entityLabel: name,
  });

  revalidatePath("/accounts");
  redirect("/accounts");
}

export async function deleteAccount(id: string) {
  const user = await requireUser();
  requireEdit(user, "accounts");

  const account = await prisma.account.findFirst({ where: { id, householdId: user.householdId } });
  if (!account) return;

  await prisma.account.deleteMany({ where: { id, householdId: user.householdId } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "accounts",
    entityLabel: account.name,
  });

  revalidatePath("/accounts");
}

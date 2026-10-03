"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function createPerson(formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "people");
  const name = String(formData.get("name") || "").trim();
  const relationship = String(formData.get("relationship") || "other");
  const dobRaw = String(formData.get("dateOfBirth") || "");

  if (!name) return;

  await prisma.person.create({
    data: {
      name,
      relationship,
      dateOfBirth: dobRaw ? new Date(dobRaw) : null,
      householdId: user.householdId,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "people",
    entityLabel: name,
  });

  revalidatePath("/people");
}

export async function updatePerson(id: string, formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "people");
  const name = String(formData.get("name") || "").trim();
  const relationship = String(formData.get("relationship") || "other");
  const dobRaw = String(formData.get("dateOfBirth") || "");

  if (!name) return;

  await prisma.person.updateMany({
    where: { id, householdId: user.householdId },
    data: { name, relationship, dateOfBirth: dobRaw ? new Date(dobRaw) : null },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "people",
    entityLabel: name,
  });

  revalidatePath("/people");
  redirect("/people");
}

export async function deletePerson(id: string) {
  const user = await requireUser();
  requireEdit(user, "people");

  const person = await prisma.person.findFirst({ where: { id, householdId: user.householdId } });
  if (!person) return;

  await prisma.person.deleteMany({ where: { id, householdId: user.householdId } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "people",
    entityLabel: person.name,
  });

  revalidatePath("/people");
}

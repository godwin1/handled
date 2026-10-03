"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function createPerson(formData: FormData) {
  const user = await requireUser();
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

  revalidatePath("/people");
}

export async function deletePerson(id: string) {
  const user = await requireUser();
  await prisma.person.deleteMany({ where: { id, householdId: user.householdId } });
  revalidatePath("/people");
}

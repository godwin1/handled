"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "other");
  const dueDateRaw = String(formData.get("dueDate") || "");
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;

  if (!title || !dueDateRaw) return;

  await prisma.task.create({
    data: {
      title,
      type,
      dueDate: new Date(dueDateRaw),
      assigneeId,
      personId,
      assetId,
      accountId,
      householdId: user.householdId,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "other");
  const dueDateRaw = String(formData.get("dueDate") || "");
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;

  if (!title || !dueDateRaw) return;

  await prisma.task.updateMany({
    where: { id, householdId: user.householdId },
    data: {
      title,
      type,
      dueDate: new Date(dueDateRaw),
      assigneeId,
      personId,
      assetId,
      accountId,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${id}`);
}

export async function toggleTaskStatus(id: string) {
  const user = await requireUser();
  const task = await prisma.task.findFirst({ where: { id, householdId: user.householdId } });
  if (!task) return;

  const nowDone = task.status !== "DONE";

  await prisma.task.update({
    where: { id },
    data: {
      status: nowDone ? "DONE" : "OPEN",
      completedAt: nowDone ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  await prisma.task.deleteMany({ where: { id, householdId: user.householdId } });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addComment(taskId: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const task = await prisma.task.findFirst({ where: { id: taskId, householdId: user.householdId } });
  if (!task) return;

  await prisma.comment.create({
    data: { body, taskId, userId: user.id },
  });

  revalidatePath("/tasks");
}

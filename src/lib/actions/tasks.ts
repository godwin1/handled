"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

const RECURRENCES = ["weekly", "monthly", "yearly"];

function normalizeRecurrence(raw: string): string | null {
  return RECURRENCES.includes(raw) ? raw : null;
}

function nextOccurrence(dueDate: Date, recurrence: string): Date {
  const next = new Date(dueDate);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (recurrence === "monthly") next.setMonth(next.getMonth() + 1);
  else if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "tasks");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "other");
  const dueDateRaw = String(formData.get("dueDate") || "");
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;
  const recurrence = normalizeRecurrence(String(formData.get("recurrence") || ""));

  if (!title || !dueDateRaw) return;

  await prisma.task.create({
    data: {
      title,
      type,
      dueDate: new Date(dueDateRaw),
      recurrence,
      assigneeId,
      personId,
      assetId,
      accountId,
      householdId: user.householdId,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "tasks",
    entityLabel: title,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTask(id: string, formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "tasks");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "other");
  const dueDateRaw = String(formData.get("dueDate") || "");
  const assigneeId = String(formData.get("assigneeId") || "") || null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;
  const recurrence = normalizeRecurrence(String(formData.get("recurrence") || ""));

  if (!title || !dueDateRaw) return;

  await prisma.task.updateMany({
    where: { id, householdId: user.householdId },
    data: {
      title,
      type,
      dueDate: new Date(dueDateRaw),
      recurrence,
      assigneeId,
      personId,
      assetId,
      accountId,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "tasks",
    entityLabel: title,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  redirect(`/tasks/${id}`);
}

export async function toggleTaskStatus(id: string) {
  const user = await requireUser();
  requireEdit(user, "tasks");

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

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "tasks",
    entityLabel: task.title,
    detail: nowDone ? "marked done" : "marked not done",
  });

  if (nowDone && task.recurrence) {
    const next = await prisma.task.create({
      data: {
        title: task.title,
        type: task.type,
        recurrence: task.recurrence,
        dueDate: nextOccurrence(task.dueDate, task.recurrence),
        assigneeId: task.assigneeId,
        personId: task.personId,
        assetId: task.assetId,
        accountId: task.accountId,
        householdId: user.householdId,
      },
    });

    await logAudit({
      householdId: user.householdId,
      userId: user.id,
      userName: user.name,
      action: "created",
      category: "tasks",
      entityLabel: next.title,
      detail: `next ${task.recurrence} occurrence`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const user = await requireUser();
  requireEdit(user, "tasks");

  const task = await prisma.task.findFirst({ where: { id, householdId: user.householdId } });
  if (!task) return;

  await prisma.task.deleteMany({ where: { id, householdId: user.householdId } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "tasks",
    entityLabel: task.title,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function addComment(taskId: string, formData: FormData) {
  const user = await requireUser();
  requireEdit(user, "tasks");
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  const task = await prisma.task.findFirst({ where: { id: taskId, householdId: user.householdId } });
  if (!task) return;

  await prisma.comment.create({
    data: { body, taskId, userId: user.id },
  });

  revalidatePath("/tasks");
}

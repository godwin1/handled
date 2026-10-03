"use server";

import path from "path";
import { put, del } from "@vercel/blob";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { extractDocument } from "@/lib/extraction";
import { canEdit, requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function uploadDocument(_prevState: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser();
  if (!canEdit(user, "documents")) {
    return { error: "You don't have permission to upload documents." };
  }
  const file = formData.get("file") as File | null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;

  if (!file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";

  // Private access: these are household IDs, insurance policies, medical
  // letters. The blob pathname (not a public URL) is what gets stored and
  // read back through the authenticated /api/documents/[id]/file route.
  const blob = await put(`${user.householdId}/${crypto.randomUUID()}${ext}`, buffer, {
    access: "private",
    contentType: mimeType,
  });

  const extraction = await extractDocument(file.name, buffer, mimeType);

  const document = await prisma.document.create({
    data: {
      title: extraction.title,
      type: extraction.type,
      status: "PENDING_REVIEW",
      fileUrl: blob.pathname,
      mimeType,
      merchant: extraction.merchant ?? null,
      amount: extraction.amount ?? null,
      currency: extraction.currency ?? null,
      dueDate: extraction.dueDate ?? null,
      expiryDate: extraction.expiryDate ?? null,
      policyNumber: extraction.policyNumber ?? null,
      suggestedTaskTitle: extraction.suggestedTaskTitle,
      suggestedTaskType: extraction.suggestedTaskType,
      suggestedTaskDueDate: extraction.suggestedTaskDueDate,
      householdId: user.householdId,
      personId,
      assetId,
      accountId,
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "documents",
    entityLabel: extraction.title,
    detail: "uploaded, pending review",
  });

  revalidatePath("/documents");
  redirect(`/documents/${document.id}`);
}

export async function confirmDocument(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();
  if (!canEdit(user, "documents")) {
    return { error: "You don't have permission to edit documents." };
  }

  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "other");
  const merchant = String(formData.get("merchant") || "").trim();
  const amountRaw = String(formData.get("amount") || "");
  const currency = String(formData.get("currency") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  const expiryDateRaw = String(formData.get("expiryDate") || "");
  const policyNumber = String(formData.get("policyNumber") || "").trim();
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;

  const createTaskFlag = formData.get("createTask") === "on";
  const taskTitle = String(formData.get("taskTitle") || "").trim();
  const taskType = String(formData.get("taskType") || "other");
  const taskDueDateRaw = String(formData.get("taskDueDate") || "");

  const existing = await prisma.document.findFirst({ where: { id, householdId: user.householdId } });
  if (!existing) return { error: "Document not found." };

  const document = await prisma.document.update({
    where: { id },
    data: {
      title: title || "Untitled document",
      type,
      merchant: merchant || null,
      amount: amountRaw ? Number(amountRaw) : null,
      currency: currency || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      expiryDate: expiryDateRaw ? new Date(expiryDateRaw) : null,
      policyNumber: policyNumber || null,
      personId,
      assetId,
      accountId,
      status: "CONFIRMED",
    },
  });

  if (createTaskFlag && taskTitle && taskDueDateRaw) {
    await prisma.task.create({
      data: {
        title: taskTitle,
        type: taskType,
        dueDate: new Date(taskDueDateRaw),
        householdId: user.householdId,
        personId,
        assetId,
        accountId,
        documentId: document.id,
      },
    });
  }

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "updated",
    category: "documents",
    entityLabel: document.title,
    detail: "confirmed",
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  redirect("/documents");
}

export async function deleteDocument(id: string) {
  const user = await requireUser();
  requireEdit(user, "documents");

  const document = await prisma.document.findFirst({ where: { id, householdId: user.householdId } });
  if (!document) return;

  await prisma.document.delete({ where: { id } });
  await del(document.fileUrl).catch(() => {});

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "documents",
    entityLabel: document.title,
  });

  revalidatePath("/documents");
}

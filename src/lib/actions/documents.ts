"use server";

import path from "path";
import { put } from "@vercel/blob";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { extractDocument } from "@/lib/extraction";
import { canEdit, requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { canAddDocument, getLimits, hasAiExtractionQuota } from "@/lib/billing";
import { encryptField } from "@/lib/encryption";

async function createDocumentFromUpload(params: {
  householdId: string;
  file: File;
  personId: string | null;
  assetId: string | null;
  accountId: string | null;
  skipAi: boolean;
  supersedesId?: string;
}) {
  const mimeType = params.file.type || "application/octet-stream";
  const buffer = Buffer.from(await params.file.arrayBuffer());
  const ext = path.extname(params.file.name) || "";

  // Private access: these are household IDs, insurance policies, medical
  // letters. The blob pathname (not a public URL) is what gets stored and
  // read back through the authenticated /api/documents/[id]/file route.
  const blob = await put(`${params.householdId}/${crypto.randomUUID()}${ext}`, buffer, {
    access: "private",
    contentType: mimeType,
  });

  const extraction = await extractDocument(params.file.name, buffer, mimeType, params.skipAi);

  return prisma.document.create({
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
      policyNumber: encryptField(extraction.policyNumber ?? null),
      extractedText: extraction.extractedText ?? null,
      suggestedTaskTitle: extraction.suggestedTaskTitle,
      suggestedTaskType: extraction.suggestedTaskType,
      suggestedTaskDueDate: extraction.suggestedTaskDueDate,
      householdId: params.householdId,
      personId: params.personId,
      assetId: params.assetId,
      accountId: params.accountId,
      supersedesId: params.supersedesId ?? null,
    },
  });
}

export async function uploadDocument(_prevState: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser();
  if (!canEdit(user, "documents")) {
    return { error: "You don't have permission to upload documents." };
  }

  if (!(await canAddDocument(user.householdId, user.household))) {
    return { error: `Your plan allows up to ${getLimits(user.household).documents} documents. Upgrade to add more.` };
  }

  const file = formData.get("file") as File | null;
  const personId = String(formData.get("personId") || "") || null;
  const assetId = String(formData.get("assetId") || "") || null;
  const accountId = String(formData.get("accountId") || "") || null;

  if (!file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  // Over quota degrades to the filename-guess fallback rather than
  // blocking the upload outright - same path as no API key configured.
  const skipAi = !(await hasAiExtractionQuota(user.householdId, user.household));
  const document = await createDocumentFromUpload({ householdId: user.householdId, file, personId, assetId, accountId, skipAi });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "documents",
    entityLabel: document.title,
    detail: "uploaded, pending review",
  });

  revalidatePath("/documents");
  redirect(`/documents/${document.id}`);
}

// Uploads a replacement for an existing document rather than a brand new
// one - the old document is kept (status SUPERSEDED) for history instead
// of being overwritten or deleted. Doesn't count against the document
// limit since canAddDocument already excludes SUPERSEDED rows: one active
// document in, one active document out.
export async function uploadNewVersion(oldDocumentId: string, _prevState: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser();
  if (!canEdit(user, "documents")) {
    return { error: "You don't have permission to upload documents." };
  }

  const old = await prisma.document.findFirst({ where: { id: oldDocumentId, householdId: user.householdId } });
  if (!old) return { error: "Document not found." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const skipAi = !(await hasAiExtractionQuota(user.householdId, user.household));
  const newDocument = await createDocumentFromUpload({
    householdId: user.householdId,
    file,
    personId: old.personId,
    assetId: old.assetId,
    accountId: old.accountId,
    skipAi,
    supersedesId: old.id,
  });

  await prisma.document.update({ where: { id: old.id }, data: { status: "SUPERSEDED" } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "created",
    category: "documents",
    entityLabel: newDocument.title,
    detail: `new version of "${old.title}"`,
  });

  revalidatePath("/documents");
  redirect(`/documents/${newDocument.id}`);
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
      policyNumber: encryptField(policyNumber || null),
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

  // The blob file is kept until the purge job actually removes the row 30
  // days from now, so a restore within the window has something to restore.
  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "deleted",
    category: "documents",
    entityLabel: document.title,
  });

  revalidatePath("/documents");
  // The form that calls this lives on the document's own detail page -
  // without a redirect, Next.js refreshes that same route's server
  // component after the action resolves, re-running its lookup for a
  // document the soft-delete filter now hides, and 404ing instead of
  // navigating away.
  redirect("/documents");
}

export async function restoreDocument(id: string) {
  const user = await requireUser();
  requireEdit(user, "documents");

  const document = await prisma.document.findFirst({ where: { id, householdId: user.householdId, deletedAt: { not: null } } });
  if (!document) return;

  await prisma.document.update({ where: { id }, data: { deletedAt: null } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "restored",
    category: "documents",
    entityLabel: document.title,
  });

  revalidatePath("/documents");
  revalidatePath("/trash");
}

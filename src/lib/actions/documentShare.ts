"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { requireEdit } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { currentOrigin } from "@/lib/url";

const EXPIRY_DAYS: Record<string, number> = { "1": 1, "7": 7, "30": 30 };

export async function createDocumentShareLink(
  documentId: string,
  _prevState: { link?: string; error?: string } | undefined,
  formData: FormData
): Promise<{ link?: string; error?: string }> {
  const user = await requireUser();
  requireEdit(user, "documents");

  const document = await prisma.document.findFirst({ where: { id: documentId, householdId: user.householdId } });
  if (!document) return { error: "Document not found." };

  const expiryDaysRaw = String(formData.get("expiryDays") || "7");
  const days = EXPIRY_DAYS[expiryDaysRaw] ?? 7;

  const link = await prisma.documentShareLink.create({
    data: {
      token: crypto.randomUUID(),
      documentId,
      createdByUserId: user.id,
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    },
  });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "document_share_created",
    category: "documents",
    entityLabel: document.title,
    detail: `expires in ${days}d`,
  });

  revalidatePath(`/documents/${documentId}`);

  const origin = await currentOrigin();
  return { link: `${origin}/share/document/${link.token}` };
}

export async function revokeDocumentShareLink(documentId: string, linkId: string) {
  const user = await requireUser();
  requireEdit(user, "documents");

  const link = await prisma.documentShareLink.findFirst({
    where: { id: linkId, documentId, document: { householdId: user.householdId } },
    include: { document: { select: { title: true } } },
  });
  if (!link || link.revokedAt) return;

  await prisma.documentShareLink.update({ where: { id: linkId }, data: { revokedAt: new Date() } });

  await logAudit({
    householdId: user.householdId,
    userId: user.id,
    userName: user.name,
    action: "document_share_revoked",
    category: "documents",
    entityLabel: link.document.title,
  });

  revalidatePath(`/documents/${documentId}`);
}

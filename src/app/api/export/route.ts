import { NextResponse } from "next/server";
import JSZip from "jszip";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptField } from "@/lib/encryption";

async function streamToBuffer(stream: AsyncIterable<Uint8Array>): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function safeFilename(title: string, id: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] || "bin";
  const slug = title.replace(/[^a-z0-9 _-]/gi, "").trim().slice(0, 60) || "document";
  return `${slug}-${id}.${ext}`;
}

// Admin-only, like the audit log - this bundles everything the household
// has stored, documents included, so it's scoped to the same trust level
// as other household-wide sensitive actions rather than every member.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const householdId = user.householdId;

  const [household, members, people, assets, accounts, tasks, documents] = await Promise.all([
    prisma.household.findUnique({ where: { id: householdId }, select: { name: true, createdAt: true } }),
    prisma.user.findMany({ where: { householdId }, select: { name: true, email: true, isAdmin: true, createdAt: true } }),
    prisma.person.findMany({ where: { householdId } }),
    prisma.asset.findMany({ where: { householdId } }),
    prisma.account.findMany({ where: { householdId } }),
    prisma.task.findMany({ where: { householdId } }),
    prisma.document.findMany({ where: { householdId } }),
  ]);

  const zip = new JSZip();

  zip.file(
    "data.json",
    JSON.stringify(
      {
        household,
        exportedAt: new Date().toISOString(),
        members,
        people,
        assets,
        accounts,
        tasks,
        documents: documents.map(({ fileUrl, ...d }) => ({ ...d, policyNumber: decryptField(d.policyNumber) })),
      },
      null,
      2
    )
  );

  const documentsFolder = zip.folder("documents");
  for (const doc of documents) {
    try {
      const blob = await get(doc.fileUrl, { access: "private" });
      if (!blob || blob.statusCode !== 200) continue;
      const buffer = await streamToBuffer(blob.stream as unknown as AsyncIterable<Uint8Array>);
      documentsFolder?.file(safeFilename(doc.title, doc.id, doc.mimeType), buffer);
    } catch (err) {
      console.error(`Export: failed to fetch blob for document ${doc.id}:`, err);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="handled-export-${new Date().toISOString().slice(0, 10)}.zip"`,
    },
  });
}

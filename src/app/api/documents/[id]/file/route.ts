import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Documents are stored in a private Blob store (these are household IDs,
// insurance policies, medical letters — not content to leave on a guessable
// public URL). This route is the only way to read one back: it checks the
// requester belongs to the owning household, then streams the blob through
// rather than ever handing out a direct blob URL.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id, householdId: user.householdId },
    select: { fileUrl: true, mimeType: true, title: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await get(document.fileUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.title)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

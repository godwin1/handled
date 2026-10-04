import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Unauthenticated by design - the token itself is the credential. Every
// access re-checks revokedAt/expiresAt rather than trusting the page that
// linked here, since this route can be hit directly.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await prisma.documentShareLink.findUnique({
    where: { token },
    select: {
      revokedAt: true,
      expiresAt: true,
      document: { select: { fileUrl: true, mimeType: true, title: true } },
    },
  });
  if (!link || link.revokedAt || link.expiresAt! < new Date()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const blob = await get(link.document.fileUrl, { access: "private" });
  if (!blob || blob.statusCode !== 200) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType || link.document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(link.document.title)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

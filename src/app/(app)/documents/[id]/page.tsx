import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteDocument } from "@/lib/actions/documents";
import { ConfirmDocumentForm } from "@/components/ConfirmDocumentForm";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const document = await prisma.document.findFirst({
    where: { id, householdId: user.householdId },
  });
  if (!document) notFound();

  const [people, assets, accounts] = await Promise.all([
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.account.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  const isImage = document.mimeType.startsWith("image/");
  const fileHref = `/api/documents/${document.id}/file`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-stone-900">
          {document.status === "PENDING_REVIEW" ? "Review document" : document.title}
        </h1>
        <form action={deleteDocument.bind(null, document.id)}>
          <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
            Delete
          </button>
        </form>
      </div>

      {isImage ? (
        <div className="relative w-full max-h-80 overflow-hidden rounded-2xl border border-stone-200/70 shadow-sm bg-stone-100">
          {/* Plain <img>, not next/image: the file lives behind an authenticated
              route, and the browser's own cookie-bearing request is what makes
              that work — Next's server-side image optimizer would fetch it
              without the session cookie and get a 401. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fileHref} alt={document.title} className="w-full h-auto object-contain max-h-80" />
        </div>
      ) : (
        <a href={fileHref} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
          View original file
        </a>
      )}

      <ConfirmDocumentForm document={document} people={people} assets={assets} accounts={accounts} />
    </div>
  );
}

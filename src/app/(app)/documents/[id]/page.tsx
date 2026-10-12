import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteDocument } from "@/lib/actions/documents";
import { revokeDocumentShareLink } from "@/lib/actions/documentShare";
import { ConfirmDocumentForm } from "@/components/ConfirmDocumentForm";
import { ShareDocumentForm } from "@/components/ShareDocumentForm";
import { UploadNewVersionForm } from "@/components/UploadNewVersionForm";
import { canEdit, canView } from "@/lib/permissions";
import { getLimits } from "@/lib/billing";
import { decryptField } from "@/lib/encryption";
import Link from "next/link";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!canView(user, "documents")) redirect("/dashboard");
  const editable = canEdit(user, "documents");

  const documentRow = await prisma.document.findFirst({
    where: { id, householdId: user.householdId },
    include: {
      supersedes: { select: { id: true, title: true, createdAt: true } },
      supersededBy: { select: { id: true, title: true, createdAt: true } },
    },
  });
  if (!documentRow) notFound();
  const document = { ...documentRow, policyNumber: decryptField(documentRow.policyNumber) };

  const [people, assets, accounts, shareLinks] = await Promise.all([
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.account.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    editable
      ? prisma.documentShareLink.findMany({
          where: { documentId: id, revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  const isImage = document.mimeType.startsWith("image/");
  const fileHref = `/api/documents/${document.id}/file`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium text-stone-900">
          {document.status === "PENDING_REVIEW" ? "Review document" : document.title}
        </h1>
        {editable && (
          <form action={deleteDocument.bind(null, document.id)}>
            <button type="submit" className="text-xs text-stone-400 hover:text-rust-600">
              Delete
            </button>
          </form>
        )}
      </div>

      {document.supersededBy && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-sm text-amber-800">
          A newer version exists.{" "}
          <Link href={`/documents/${document.supersededBy.id}`} className="underline hover:text-amber-950">
            View it
          </Link>
          .
        </div>
      )}

      {isImage ? (
        <div className="relative w-full max-h-80 overflow-hidden rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] bg-stone-100">
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

      {editable ? (
        <ConfirmDocumentForm document={document} people={people} assets={assets} accounts={accounts} />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5 text-sm text-stone-500">
          You have view-only access to documents.
        </div>
      )}

      {editable && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-stone-900">Share outside your household</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Anyone with the link can view this document without an account — for an accountant, landlord, etc.
            </p>
          </div>
          {getLimits(user.household).sharing ? (
            <ShareDocumentForm documentId={document.id} />
          ) : (
            <p className="text-xs text-stone-500">
              This needs a Plus or Family plan.{" "}
              <Link href="/billing" className="text-accent-600 underline hover:text-accent-700">
                Upgrade
              </Link>
            </p>
          )}
          {shareLinks.length > 0 && (
            <div className="border-t border-stone-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-stone-600">Active links</p>
              {shareLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between text-xs text-stone-500">
                  <span>Expires {link.expiresAt!.toLocaleDateString()}</span>
                  <form action={revokeDocumentShareLink.bind(null, document.id, link.id)}>
                    <button type="submit" className="text-stone-400 hover:text-rust-600">
                      Revoke
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {editable && !document.supersededBy && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-medium text-stone-900">Version history</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Got a renewed or corrected copy? Replace it here — the old one stays on record below.
            </p>
          </div>
          {document.supersedes && (
            <p className="text-xs text-stone-500">
              Replaces{" "}
              <Link href={`/documents/${document.supersedes.id}`} className="underline hover:text-stone-900">
                an earlier version
              </Link>{" "}
              from {document.supersedes.createdAt.toLocaleDateString()}.
            </p>
          )}
          <UploadNewVersionForm documentId={document.id} />
        </section>
      )}
    </div>
  );
}

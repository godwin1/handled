import { prisma } from "@/lib/prisma";

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await prisma.documentShareLink.findUnique({
    where: { token },
    include: { document: true },
  });

  const invalid = !link || !!link.revokedAt || link.expiresAt! < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
          <p className="mt-2 text-sm text-stone-500">Shared document</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6 space-y-4">
          {invalid ? (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">Link not valid</h2>
              <p className="text-sm text-stone-500">
                This share link has expired or been revoked. Ask whoever sent it for a new one.
              </p>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-medium text-stone-900">{link.document.title}</h2>
                <p className="text-xs text-stone-500 mt-1 capitalize">
                  {link.document.type}
                  {link.document.merchant && ` · ${link.document.merchant}`}
                </p>
              </div>

              <div className="text-sm text-stone-600 space-y-1">
                {link.document.amount != null && (
                  <p>
                    Amount: {link.document.currency ?? ""} {link.document.amount}
                  </p>
                )}
                {link.document.dueDate && <p>Due: {link.document.dueDate.toLocaleDateString()}</p>}
                {link.document.expiryDate && <p>Expires: {link.document.expiryDate.toLocaleDateString()}</p>}
                {link.document.policyNumber && <p>Reference: {link.document.policyNumber}</p>}
              </div>

              {link.document.mimeType.startsWith("image/") ? (
                <div className="relative w-full max-h-80 overflow-hidden rounded-xl border border-stone-200/70 bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/share/${token}/file`}
                    alt={link.document.title}
                    className="w-full h-auto object-contain max-h-80"
                  />
                </div>
              ) : (
                <a href={`/api/share/${token}/file`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
                  View original file
                </a>
              )}

              <p className="text-xs text-stone-400">This link expires {link.expiresAt!.toLocaleDateString()}.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

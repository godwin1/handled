import { prisma } from "@/lib/prisma";
import { cancelLegacyAccessRequest } from "@/lib/actions/legacyAccess";

export default async function CancelLegacyAccessPage({ params }: { params: Promise<{ cancelToken: string }> }) {
  const { cancelToken } = await params;

  const before = await prisma.legacyAccessRequest.findUnique({ where: { cancelToken }, include: { link: true } });
  const result = before ? await cancelLegacyAccessRequest(cancelToken) : { cancelled: false };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
          {result.cancelled ? (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">Request cancelled</h2>
              <p className="text-sm text-stone-500">
                {before?.link.contactName}'s emergency access request has been cancelled. They can start a new one
                with their link if needed again later.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">Nothing to cancel</h2>
              <p className="text-sm text-stone-500">
                This link is invalid, or the request it refers to was already cancelled or granted.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { RequestLegacyAccessButton } from "@/components/RequestLegacyAccessButton";

export default async function LegacyAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await prisma.legacyAccessLink.findUnique({
    where: { token },
    include: { household: { select: { name: true } }, requests: { orderBy: { requestedAt: "desc" }, take: 1 } },
  });

  const latest = link?.requests[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
          <p className="mt-2 text-sm text-stone-500">Emergency access</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6 space-y-4">
          {!link ? (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">Link not valid</h2>
              <p className="text-sm text-stone-500">This link has been revoked or doesn't exist.</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-stone-900">{link.household.name}</h2>
              <p className="text-sm text-stone-500">
                This is an emergency access link created for {link.contactName}. Requesting access notifies every
                admin of this household and, unless one of them cancels it, grants you access after a waiting
                period.
              </p>
              {latest?.status === "pending" ? (
                <p className="text-sm text-stone-700">
                  A request is already in progress — you'll get access on{" "}
                  <strong>{latest.grantAt.toLocaleDateString()}</strong> unless cancelled.
                </p>
              ) : latest?.status === "granted" ? (
                <p className="text-sm text-stone-700">
                  You already have access — check your email for the link to set your password.
                </p>
              ) : (
                <RequestLegacyAccessButton token={token} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

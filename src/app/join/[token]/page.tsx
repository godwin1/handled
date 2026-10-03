import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const currentUser = await getCurrentUser();

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { household: { select: { name: true } } },
  });

  const invalid = !invite || !!invite.acceptedAt || invite.expiresAt < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-medium text-accent-600">Handled</h1>
          <p className="mt-2 text-sm text-stone-500">Nothing important slips.</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
          {invalid ? (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">Invite not valid</h2>
              <p className="text-sm text-stone-500">
                This invite link has expired, already been used, or doesn&apos;t exist. Ask whoever sent it for a
                new one.
              </p>
            </>
          ) : currentUser ? (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-2">You&apos;re already logged in</h2>
              <p className="text-sm text-stone-500">
                You&apos;re signed in as {currentUser.email}. Log out first to accept this invite to join{" "}
                {invite.household.name}.
              </p>
              <Link href="/dashboard" className="mt-4 inline-block text-sm text-accent-600 underline hover:text-accent-700">
                Go to your dashboard
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-lg font-medium text-stone-900 mb-1">Join {invite.household.name}</h2>
              <p className="text-sm text-stone-500 mb-4">
                You&apos;ll share the same dashboard, tasks, and documents as the rest of the household.
              </p>
              <JoinForm token={token} prefilledEmail={invite.email} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

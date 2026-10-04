import { requireUser, getCurrentSessionId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revokeSession, revokeAllOtherSessions } from "@/lib/actions/account";
import { startEnrollment } from "@/lib/actions/twoFactor";
import { friendlyUserAgent } from "@/lib/userAgent";
import { DisableTwoFactorForm } from "@/components/DisableTwoFactorForm";
import { RegenerateBackupCodesButton } from "@/components/RegenerateBackupCodesButton";

export default async function AccountPage() {
  const user = await requireUser();
  const currentSessionId = await getCurrentSessionId();

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Account</h1>
        <p className="text-sm text-stone-500 mt-1">
          {user.name} · {user.email}
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-stone-900">Two-factor authentication</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {user.totpEnabled
              ? "Enabled — your authenticator app is required at sign-in."
              : "Add an authenticator app (Google Authenticator, Authy, etc.) as a second sign-in step."}
          </p>
        </div>

        {user.totpEnabled ? (
          <div className="space-y-3">
            <RegenerateBackupCodesButton />
            <DisableTwoFactorForm />
          </div>
        ) : (
          <form action={startEnrollment}>
            <button
              type="submit"
              className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700"
            >
              Enable two-factor authentication
            </button>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-stone-900">Active sessions</h2>
          {sessions.length > 1 && (
            <form action={revokeAllOtherSessions}>
              <button type="submit" className="text-xs text-stone-500 hover:text-red-600">
                Log out all other sessions
              </button>
            </form>
          )}
        </div>
        <div className="divide-y divide-stone-100">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSessionId;
            return (
              <div key={s.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm text-stone-900">
                    {friendlyUserAgent(s.userAgent)}
                    {isCurrent && <span className="ml-2 text-xs text-sage-700">This device</span>}
                  </p>
                  <p className="text-xs text-stone-500">
                    {s.ipAddress ?? "Unknown IP"} · signed in {s.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {!isCurrent && (
                  <form action={revokeSession.bind(null, s.id)}>
                    <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                      Log out
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

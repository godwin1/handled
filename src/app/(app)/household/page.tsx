import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/components/InviteForm";
import { revokeInvite } from "@/lib/actions/household";

export default async function HouseholdPage() {
  const user = await requireUser();

  const [members, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { householdId: user.householdId },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invite.findMany({
      where: { householdId: user.householdId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">{user.household.name}</h1>
        <p className="text-sm text-stone-500 mt-1">Everyone here shares the same dashboard, tasks, and documents.</p>
      </div>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Members</h2>
        <div className="divide-y divide-stone-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {m.name} {m.id === user.id && <span className="text-xs text-stone-400">(you)</span>}
                </p>
                <p className="text-xs text-stone-500">{m.email}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-1">Invite someone</h2>
        <p className="text-xs text-stone-500 mb-3">
          Create a link and send it to them yourself (text, email, however). It works once and expires in 7 days.
        </p>
        <InviteForm />
      </section>

      {pendingInvites.length > 0 && (
        <section className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-3">Pending invites</h2>
          <div className="divide-y divide-stone-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-stone-900">{invite.email ?? "Open invite (no email set)"}</p>
                  <p className="text-xs text-stone-500">Expires {invite.expiresAt.toLocaleDateString()}</p>
                </div>
                <form action={revokeInvite.bind(null, invite.id)}>
                  <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                    Revoke
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

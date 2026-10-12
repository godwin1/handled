import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "@/components/InviteForm";
import { HouseholdPageHeader } from "@/components/HouseholdPageHeader";
import { revokeInvite } from "@/lib/actions/household";

export default async function InviteHouseholdPage() {
  const user = await requireUser();

  const pendingInvites = await prisma.invite.findMany({
    where: { householdId: user.householdId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />

      <section className="bg-stone-50 border border-stone-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-1">Invite someone</h2>
        <p className="text-xs text-stone-500 mb-3">
          Create a link and send it to them yourself (text, email, however). It works once and expires in 7 days.
        </p>
        <InviteForm />
      </section>

      {pendingInvites.length > 0 && (
        <section className="bg-stone-50 border border-stone-200 rounded-xl p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-3">Pending invites</h2>
          <div className="divide-y divide-stone-200/70">
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

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PermissionSelect } from "@/components/PermissionSelect";
import { RemoveMemberButton } from "@/components/RemoveMemberButton";
import { ResetTwoFactorButton } from "@/components/ResetTwoFactorButton";
import { HouseholdPageHeader } from "@/components/HouseholdPageHeader";
import { setMemberAdmin } from "@/lib/actions/household";
import { CATEGORIES, getLevel } from "@/lib/permissions";

export default async function HouseholdPage() {
  const user = await requireUser();

  const [members, adminCount] = await Promise.all([
    prisma.user.findMany({
      where: { householdId: user.householdId },
      select: { id: true, name: true, email: true, createdAt: true, isAdmin: true, permissions: true, totpEnabled: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.count({ where: { householdId: user.householdId, isAdmin: true } }),
  ]);

  return (
    <div className="space-y-6">
      <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Members</h2>
        <div className="divide-y divide-stone-100">
          {members.map((m) => {
            const canDemote = !m.isAdmin || adminCount > 1;
            return (
              <div key={m.id} className="py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900 flex items-center gap-2">
                      {m.name}
                      {m.id === user.id && <span className="text-xs text-stone-400">(you)</span>}
                      {m.isAdmin && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-accent-100 text-accent-700">
                          Admin
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500">{m.email}</p>
                  </div>
                  {user.isAdmin && (
                    <div className="flex items-center gap-3 shrink-0">
                      <form action={setMemberAdmin.bind(null, m.id, !m.isAdmin)}>
                        <button
                          type="submit"
                          disabled={m.isAdmin && !canDemote}
                          title={m.isAdmin && !canDemote ? "A household needs at least one admin" : undefined}
                          className="text-xs text-stone-400 hover:text-accent-600 disabled:opacity-40 disabled:hover:text-stone-400"
                        >
                          {m.isAdmin ? "Remove admin" : "Make admin"}
                        </button>
                      </form>
                      {m.id !== user.id && (!m.isAdmin || canDemote) && (
                        <RemoveMemberButton userId={m.id} name={m.name} />
                      )}
                    </div>
                  )}
                </div>

                {user.isAdmin && !m.isAdmin && (
                  <div className="flex flex-wrap gap-3 pl-0.5">
                    {CATEGORIES.map((c) => (
                      <div key={c.key} className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-500">{c.label}</span>
                        <PermissionSelect userId={m.id} category={c.key} level={getLevel(m, c.key)} />
                      </div>
                    ))}
                  </div>
                )}

                {user.isAdmin && m.id !== user.id && m.totpEnabled && (
                  <div className="pl-0.5">
                    <ResetTwoFactorButton userId={m.id} name={m.name} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

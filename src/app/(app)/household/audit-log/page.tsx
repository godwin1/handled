import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { HouseholdPageHeader } from "@/components/HouseholdPageHeader";
import { getLimits } from "@/lib/billing";

const ACTION_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  restored: "restored",
  member_joined: "joined the household",
  member_removed: "removed from the household",
  member_admin_changed: "admin status changed",
  member_permission_changed: "permissions changed",
  member_2fa_reset: "had two-factor authentication reset",
  invite_created: "invite created",
  invite_revoked: "invite revoked",
  document_share_created: "created a share link for",
  document_share_revoked: "revoked a share link for",
};

export default async function AuditLogPage() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/household");

  if (!getLimits(user.household).auditLog) {
    return (
      <div className="space-y-6">
        <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-sm text-stone-600">
          The activity log needs a Family plan.{" "}
          <Link href="/billing" className="text-accent-600 underline hover:text-accent-700">
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  const entries = await prisma.auditLog.findMany({
    where: { householdId: user.householdId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        {entries.length === 0 ? (
          <p className="text-sm text-stone-400">No activity yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-stone-900">
                    <span className="font-medium">{entry.userNameAtTime}</span>{" "}
                    {ACTION_LABELS[entry.action] ?? entry.action}{" "}
                    {entry.category !== "member" && <span className="text-stone-500">&ldquo;{entry.entityLabel}&rdquo;</span>}
                    {entry.category === "member" && <span className="text-stone-500">{entry.entityLabel}</span>}
                  </p>
                  {entry.detail && <p className="text-xs text-stone-400 mt-0.5">{entry.detail}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge label={entry.category} />
                  <span className="text-xs text-stone-400">
                    {entry.createdAt.toLocaleDateString()} {entry.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

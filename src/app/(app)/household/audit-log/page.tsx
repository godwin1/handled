import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";

const ACTION_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  member_joined: "joined the household",
  member_removed: "removed from the household",
  member_admin_changed: "admin status changed",
  member_permission_changed: "permissions changed",
  invite_created: "invite created",
  invite_revoked: "invite revoked",
};

export default async function AuditLogPage() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/household");

  const entries = await prisma.auditLog.findMany({
    where: { householdId: user.householdId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/household" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to household
        </Link>
      </div>

      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Activity log</h1>
        <p className="text-sm text-stone-500 mt-1">Every change made across your household, newest first.</p>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
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

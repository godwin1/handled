import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEdit } from "@/lib/permissions";
import { restorePerson } from "@/lib/actions/people";
import { restoreAsset } from "@/lib/actions/assets";
import { restoreAccount } from "@/lib/actions/accounts";
import { restoreTask } from "@/lib/actions/tasks";
import { restoreDocument } from "@/lib/actions/documents";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/EmptyState";
import { Trash2 } from "lucide-react";

const RETENTION_DAYS = 30;

function daysLeft(deletedAt: Date) {
  const elapsed = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(RETENTION_DAYS - elapsed));
}

function restoreButtonClass() {
  return "text-xs font-medium text-accent-600 hover:text-accent-700";
}

export default async function TrashPage() {
  const user = await requireUser();

  const seePeople = canEdit(user, "people");
  const seeAssets = canEdit(user, "assets");
  const seeAccounts = canEdit(user, "accounts");
  const seeDocuments = canEdit(user, "documents");
  const seeTasks = canEdit(user, "tasks");

  const [people, assets, accounts, documents, tasks] = await Promise.all([
    seePeople
      ? prisma.person.findMany({ where: { householdId: user.householdId, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } })
      : [],
    seeAssets
      ? prisma.asset.findMany({ where: { householdId: user.householdId, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } })
      : [],
    seeAccounts
      ? prisma.account.findMany({ where: { householdId: user.householdId, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } })
      : [],
    seeDocuments
      ? prisma.document.findMany({ where: { householdId: user.householdId, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } })
      : [],
    seeTasks
      ? prisma.task.findMany({ where: { householdId: user.householdId, deletedAt: { not: null } }, orderBy: { deletedAt: "desc" } })
      : [],
  ]);

  const isEmpty = people.length + assets.length + accounts.length + documents.length + tasks.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Trash</h1>
        <p className="text-sm text-stone-500 mt-1">
          Deleted items stay here for {RETENTION_DAYS} days before they&apos;re permanently removed.
        </p>
      </div>

      {isEmpty && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <EmptyState icon={Trash2} label="Nothing in the trash." />
        </section>
      )}

      {seePeople && people.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">People</h2>
          <div className="divide-y divide-stone-100">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-3 justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{p.name}</p>
                  <p className="text-xs text-stone-500">{daysLeft(p.deletedAt!)} days left</p>
                </div>
                <form action={restorePerson.bind(null, p.id)}>
                  <button type="submit" className={restoreButtonClass()}>
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {seeAssets && assets.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Assets</h2>
          <div className="divide-y divide-stone-100">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center gap-3 justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={a.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{a.name}</p>
                    <p className="text-xs text-stone-500">{daysLeft(a.deletedAt!)} days left</p>
                  </div>
                </div>
                <form action={restoreAsset.bind(null, a.id)}>
                  <button type="submit" className={restoreButtonClass()}>
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {seeAccounts && accounts.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Accounts</h2>
          <div className="divide-y divide-stone-100">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={a.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{a.name}</p>
                    <p className="text-xs text-stone-500">{daysLeft(a.deletedAt!)} days left</p>
                  </div>
                </div>
                <form action={restoreAccount.bind(null, a.id)}>
                  <button type="submit" className={restoreButtonClass()}>
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {seeDocuments && documents.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Documents</h2>
          <div className="divide-y divide-stone-100">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={d.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{d.title}</p>
                    <p className="text-xs text-stone-500">{daysLeft(d.deletedAt!)} days left</p>
                  </div>
                </div>
                <form action={restoreDocument.bind(null, d.id)}>
                  <button type="submit" className={restoreButtonClass()}>
                    Restore
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {seeTasks && tasks.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Tasks</h2>
          <div className="divide-y divide-stone-100">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={t.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{t.title}</p>
                    <p className="text-xs text-stone-500">{daysLeft(t.deletedAt!)} days left</p>
                  </div>
                </div>
                <form action={restoreTask.bind(null, t.id)}>
                  <button type="submit" className={restoreButtonClass()}>
                    Restore
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

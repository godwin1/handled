import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskRow } from "@/components/TaskRow";
import { createTask } from "@/lib/actions/tasks";
import { canEdit, canView } from "@/lib/permissions";

const TASK_TYPES = ["pay", "renew", "cancel", "book", "submit", "call", "other"];

export default async function TasksPage() {
  const user = await requireUser();
  if (!canView(user, "tasks")) redirect("/dashboard");
  const editable = canEdit(user, "tasks");

  const include = {
    assignee: { select: { name: true } },
    person: { select: { name: true } },
    asset: { select: { name: true } },
    account: { select: { name: true } },
  };

  const [openTasks, doneTasks, people, assets, accounts, members] = await Promise.all([
    prisma.task.findMany({
      where: { householdId: user.householdId, status: "OPEN" },
      orderBy: { dueDate: "asc" },
      include,
    }),
    prisma.task.findMany({
      where: { householdId: user.householdId, status: "DONE" },
      orderBy: { completedAt: "desc" },
      take: 20,
      include,
    }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.account.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-medium text-stone-900">Tasks</h1>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-1">Open</h2>
        {openTasks.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">Nothing open.</p>
        ) : (
          <div>
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} editable={editable} />
            ))}
          </div>
        )}
      </section>

      {editable && (
      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Add a task</h2>
        <form action={createTask} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Title</label>
            <input name="title" required className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
            <select name="type" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Due date</label>
            <input type="date" name="dueDate" required className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Assignee</label>
            <select name="assigneeId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Person</label>
            <select name="personId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Asset</label>
            <select name="assetId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Account</label>
            <select name="accountId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700">
            Add
          </button>
        </form>
      </section>
      )}

      {doneTasks.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-1">Recently done</h2>
          <div>
            {doneTasks.map((task) => (
              <TaskRow key={task.id} task={task} editable={editable} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

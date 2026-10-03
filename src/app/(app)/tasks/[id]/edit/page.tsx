import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTask } from "@/lib/actions/tasks";

const TASK_TYPES = ["pay", "renew", "cancel", "book", "submit", "call", "other"];

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [task, people, assets, accounts, members] = await Promise.all([
    prisma.task.findFirst({ where: { id, householdId: user.householdId } }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.account.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.user.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);
  if (!task) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href={`/tasks/${task.id}`} className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to task
        </Link>
      </div>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h1 className="text-lg font-medium text-stone-900 mb-4">Edit task</h1>
        <form action={updateTask.bind(null, task.id)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Title</label>
            <input name="title" defaultValue={task.title} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
              <select name="type" defaultValue={task.type} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Due date</label>
              <input type="date" name="dueDate" defaultValue={toInputDate(task.dueDate)} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Assignee</label>
            <select name="assigneeId" defaultValue={task.assigneeId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Person</label>
              <select name="personId" defaultValue={task.personId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
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
              <select name="assetId" defaultValue={task.assetId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
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
              <select name="accountId" defaultValue={task.accountId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

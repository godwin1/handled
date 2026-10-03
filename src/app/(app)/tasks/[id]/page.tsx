import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { addComment, deleteTask, toggleTaskStatus } from "@/lib/actions/tasks";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const task = await prisma.task.findFirst({
    where: { id, householdId: user.householdId },
    include: {
      assignee: { select: { name: true } },
      person: { select: { name: true } },
      asset: { select: { name: true } },
      account: { select: { name: true } },
      document: { select: { id: true, title: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!task) notFound();

  const done = task.status === "DONE";

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Link href="/tasks" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to tasks
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className={`font-display text-xl font-medium ${done ? "text-stone-400 line-through" : "text-stone-900"}`}>
            {task.title}
          </h1>
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/tasks/${task.id}/edit`} className="text-xs text-stone-400 hover:text-stone-900">
              Edit
            </Link>
            <form action={deleteTask.bind(null, task.id)}>
              <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                Delete
              </button>
            </form>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <Badge label={task.type} />
          <span>Due {task.dueDate.toLocaleDateString()}</span>
          {task.assignee && <span>· Assigned to {task.assignee.name}</span>}
        </div>

        <div className="text-sm text-stone-600 space-y-1">
          {task.person && <p>Person: {task.person.name}</p>}
          {task.asset && <p>Asset: {task.asset.name}</p>}
          {task.account && <p>Account: {task.account.name}</p>}
          {task.document && (
            <p>
              Document:{" "}
              <Link href={`/documents/${task.document.id}`} className="underline">
                {task.document.title}
              </Link>
            </p>
          )}
        </div>

        <form action={toggleTaskStatus.bind(null, task.id)}>
          <button
            type="submit"
            className={`rounded-md text-sm font-medium px-4 py-1.5 ${
              done ? "border border-stone-300 text-stone-700 hover:bg-stone-50" : "bg-accent-600 text-white hover:bg-accent-700"
            }`}
          >
            {done ? "Mark as not done" : "Mark as done"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-medium text-stone-900">Comments</h2>
        {task.comments.length === 0 ? (
          <p className="text-sm text-stone-400">No comments yet.</p>
        ) : (
          <div className="space-y-3">
            {task.comments.map((c) => (
              <div key={c.id} className="text-sm">
                <p className="text-stone-800">{c.body}</p>
                <p className="text-xs text-stone-400">
                  {c.user.name} · {c.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
        <form action={addComment.bind(null, task.id)} className="flex gap-2">
          <input
            name="body"
            placeholder="e.g. Paid from joint account"
            required
            className="flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

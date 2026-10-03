import Link from "next/link";
import { Badge } from "@/components/Badge";
import { toggleTaskStatus } from "@/lib/actions/tasks";

type TaskWithRelations = {
  id: string;
  title: string;
  type: string;
  status: string;
  dueDate: Date;
  assignee: { name: string } | null;
  person: { name: string } | null;
  asset: { name: string } | null;
  account: { name: string } | null;
};

function formatDue(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", overdue: false };
  if (diffDays === 1) return { label: "Tomorrow", overdue: false };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  return { label: `in ${diffDays}d`, overdue: false };
}

export function TaskRow({ task }: { task: TaskWithRelations }) {
  const related = task.person?.name || task.asset?.name || task.account?.name;
  const due = formatDue(task.dueDate);
  const done = task.status === "DONE";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-stone-100 last:border-0">
      <form action={toggleTaskStatus.bind(null, task.id)}>
        <button
          type="submit"
          aria-label={done ? "Mark as not done" : "Mark as done"}
          className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
            done ? "bg-sage-600 border-sage-600 text-white" : "border-stone-300 hover:border-accent-400"
          }`}
        >
          {done && (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z" />
            </svg>
          )}
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <Link
          href={`/tasks/${task.id}`}
          className={`text-sm font-medium truncate hover:underline block ${
            done ? "text-stone-400 line-through" : "text-stone-900"
          }`}
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
          <Badge label={task.type} />
          {related && <span>{related}</span>}
          {task.assignee && <span>· {task.assignee.name}</span>}
        </div>
      </div>

      <span className={`text-xs font-medium shrink-0 ${due.overdue && !done ? "text-rust-600" : "text-stone-500"}`}>
        {done ? "Done" : due.label}
      </span>
    </div>
  );
}

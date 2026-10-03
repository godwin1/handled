import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TaskRow } from "@/components/TaskRow";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const today = startOfToday();
  const weekEnd = addDays(today, 7);
  const monthEnd = addDays(today, 30);

  const include = {
    assignee: { select: { name: true } },
    person: { select: { name: true } },
    asset: { select: { name: true } },
    account: { select: { name: true } },
  };

  const [overdueTasks, thisWeekTasks, next30Tasks, pendingDocuments, documentCount, confirmedCount] =
    await Promise.all([
      prisma.task.findMany({
        where: { householdId: user.householdId, status: "OPEN", dueDate: { lt: today } },
        orderBy: { dueDate: "asc" },
        include,
      }),
      prisma.task.findMany({
        where: { householdId: user.householdId, status: "OPEN", dueDate: { gte: today, lt: weekEnd } },
        orderBy: { dueDate: "asc" },
        include,
      }),
      prisma.task.findMany({
        where: { householdId: user.householdId, status: "OPEN", dueDate: { gte: weekEnd, lt: monthEnd } },
        orderBy: { dueDate: "asc" },
        include,
      }),
      prisma.document.findMany({
        where: { householdId: user.householdId, status: "PENDING_REVIEW" },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.document.count({ where: { householdId: user.householdId } }),
      prisma.document.count({ where: { householdId: user.householdId, status: "CONFIRMED" } }),
    ]);

  const dueThisWeekCount = overdueTasks.length + thisWeekTasks.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-stone-900">This week</h1>
        <p className="text-sm text-stone-500 mt-1">
          {dueThisWeekCount === 0
            ? "Nothing due this week. You're on top of it."
            : `${dueThisWeekCount} thing${dueThisWeekCount === 1 ? "" : "s"} due this week.`}
        </p>
      </div>

      {pendingDocuments.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="text-sm font-medium text-amber-900 mb-2">
            {pendingDocuments.length} document{pendingDocuments.length === 1 ? "" : "s"} need review
          </h2>
          <div className="space-y-1">
            {pendingDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="block text-sm text-amber-800 hover:text-amber-950 underline"
              >
                {doc.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-1">Overdue &amp; due this week</h2>
        {overdueTasks.length === 0 && thisWeekTasks.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">Nothing here.</p>
        ) : (
          <div>
            {overdueTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {thisWeekTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-1">Next 30 days</h2>
        {next30Tasks.length === 0 ? (
          <p className="text-sm text-stone-400 py-2">Nothing scheduled.</p>
        ) : (
          <div>
            {next30Tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between">
        <h2 className="text-sm font-medium text-stone-900">Documents</h2>
        <p className="text-sm text-stone-500">
          {confirmedCount} filed · {documentCount - confirmedCount} pending review
        </p>
      </section>
    </div>
  );
}

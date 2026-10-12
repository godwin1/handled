import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canView } from "@/lib/permissions";
import { monthlyEquivalent, monthlyTotalsByCurrency, formatMoney, formatMoneyTotals } from "@/lib/money";
import { startOfTodayFor } from "@/lib/timezone";
import { BarChart, type BarDatum } from "@/components/BarChart";

function lastSixMonths(): Date[] {
  const months: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - i);
    d.setUTCHours(0, 0, 0, 0);
    months.push(d);
  }
  return months;
}

function bucketByMonth(dates: Date[], months: Date[]): number[] {
  return months.map((monthStart, i) => {
    const monthEnd =
      i < months.length - 1 ? months[i + 1] : new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    return dates.filter((d) => d >= monthStart && d < monthEnd).length;
  });
}

export default async function ReportsPage() {
  const user = await requireUser();
  const seeAccounts = canView(user, "accounts");
  const seeTasks = canView(user, "tasks");
  const seeDocuments = canView(user, "documents");

  const months = lastSixMonths();
  const today = startOfTodayFor(user.timezone);
  const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [accounts, completedTasks, newDocuments, openTaskCount, overdueTaskCount] = await Promise.all([
    seeAccounts
      ? prisma.account.findMany({
          where: { householdId: user.householdId, amount: { not: null } },
          select: { type: true, amount: true, billingCycle: true, currency: true },
        })
      : [],
    seeTasks
      ? prisma.task.findMany({
          where: { householdId: user.householdId, status: "DONE", completedAt: { gte: months[0] } },
          select: { completedAt: true },
        })
      : [],
    seeDocuments
      ? prisma.document.findMany({
          where: { householdId: user.householdId, status: { not: "SUPERSEDED" }, createdAt: { gte: months[0] } },
          select: { createdAt: true },
        })
      : [],
    seeTasks ? prisma.task.count({ where: { householdId: user.householdId, status: "OPEN" } }) : 0,
    seeTasks ? prisma.task.count({ where: { householdId: user.householdId, status: "OPEN", dueDate: { lt: today } } }) : 0,
  ]);

  const monthLabels = months.map((m) => m.toLocaleDateString(undefined, { month: "short", timeZone: "UTC" }));

  const tasksCompletedPerMonth = bucketByMonth(completedTasks.map((t) => t.completedAt!), months);
  const documentsAddedPerMonth = bucketByMonth(newDocuments.map((d) => d.createdAt), months);
  const tasksCompletedThisMonth = completedTasks.filter((t) => t.completedAt! >= startOfMonth).length;

  const monthlyTotals = monthlyTotalsByCurrency(accounts);
  const multiCurrency = Object.keys(monthlyTotals).length > 1;

  // One bar per (type, currency) - only disambiguated by currency in the
  // label when more than one is actually present, so the common
  // single-currency household doesn't see redundant "(USD)" everywhere.
  const byTypeAndCurrency = new Map<string, number>();
  for (const account of accounts) {
    const amount = monthlyEquivalent(account);
    if (amount === 0) continue;
    const currency = (account.currency || "USD").toUpperCase();
    const key = multiCurrency ? `${account.type} (${currency})` : account.type;
    byTypeAndCurrency.set(key, (byTypeAndCurrency.get(key) ?? 0) + amount);
  }
  const spendByType: BarDatum[] = [...byTypeAndCurrency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      value,
      displayValue: formatMoney(value, label.match(/\(([A-Z]+)\)/)?.[1]),
    }));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-medium text-stone-900">Insights</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {seeAccounts && (
          <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-4">
            <p className="text-xs text-stone-500">Monthly bills</p>
            <p className="text-lg font-display text-stone-900 mt-1">
              {Object.keys(monthlyTotals).length > 0 ? formatMoneyTotals(monthlyTotals, "") : "—"}
            </p>
          </div>
        )}
        {seeTasks && (
          <>
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-4">
              <p className="text-xs text-stone-500">Completed this month</p>
              <p className="text-lg font-display text-stone-900 mt-1">{tasksCompletedThisMonth}</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-4">
              <p className="text-xs text-stone-500">Open tasks</p>
              <p className="text-lg font-display text-stone-900 mt-1">{openTaskCount}</p>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-4">
              <p className="text-xs text-stone-500">Overdue</p>
              <p className={`text-lg font-display mt-1 ${overdueTaskCount > 0 ? "text-rust-600" : "text-stone-900"}`}>
                {overdueTaskCount}
              </p>
            </div>
          </>
        )}
      </div>

      {seeAccounts && spendByType.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Monthly spend by type</h2>
          <BarChart data={spendByType} orientation="horizontal" />
        </section>
      )}

      {seeTasks && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Tasks completed per month</h2>
          <BarChart
            data={monthLabels.map((label, i) => ({ label, value: tasksCompletedPerMonth[i], displayValue: String(tasksCompletedPerMonth[i]) }))}
          />
        </section>
      )}

      {seeDocuments && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Documents added per month</h2>
          <BarChart
            data={monthLabels.map((label, i) => ({ label, value: documentsAddedPerMonth[i], displayValue: String(documentsAddedPerMonth[i]) }))}
          />
        </section>
      )}
    </div>
  );
}

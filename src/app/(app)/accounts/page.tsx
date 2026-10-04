import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccount, deleteAccount } from "@/lib/actions/accounts";
import { canEdit, canView } from "@/lib/permissions";
import { monthlyEquivalent, formatMoney } from "@/lib/money";

const TYPES = ["utility", "internet", "insurance", "bank", "school", "medical", "other"];
const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "yearly", label: "Yearly" },
  { value: "one_time", label: "One-time" },
];

function billingLabel(account: { amount: number | null; currency: string | null; billingCycle: string | null }) {
  if (!account.amount) return null;
  const cycleLabel = BILLING_CYCLES.find((c) => c.value === account.billingCycle)?.label ?? "Monthly";
  const suffix = account.billingCycle === "one_time" ? "" : ` / ${cycleLabel.toLowerCase()}`;
  return `${formatMoney(account.amount, account.currency)}${suffix}`;
}

export default async function AccountsPage() {
  const user = await requireUser();
  if (!canView(user, "accounts")) redirect("/dashboard");
  const editable = canEdit(user, "accounts");

  const [accounts, people, assets] = await Promise.all([
    prisma.account.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "asc" },
      include: { person: { select: { name: true } }, asset: { select: { name: true } } },
    }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  const monthlyTotal = accounts.reduce((sum, a) => sum + monthlyEquivalent(a), 0);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-medium text-stone-900">Accounts</h1>

      {monthlyTotal > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-900">Recurring bills</h2>
          <p className="text-sm text-stone-500">
            {formatMoney(monthlyTotal)}/month · {formatMoney(monthlyTotal * 12)}/year (est.)
          </p>
        </section>
      )}

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        {accounts.length === 0 ? (
          <p className="text-sm text-stone-400">No accounts added yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{account.name}</p>
                  <p className="text-xs text-stone-500 capitalize">
                    {account.type}
                    {account.provider && ` · ${account.provider}`}
                    {account.person && ` · ${account.person.name}`}
                    {account.asset && ` · ${account.asset.name}`}
                    {billingLabel(account) && ` · ${billingLabel(account)}`}
                  </p>
                </div>
                {editable && (
                  <div className="flex items-center gap-3">
                    <Link href={`/accounts/${account.id}/edit`} className="text-xs text-stone-400 hover:text-stone-900">
                      Edit
                    </Link>
                    <form action={deleteAccount.bind(null, account.id)}>
                      <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
                        Remove
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {editable && (
      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Add an account</h2>
        <form action={createAccount} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input name="name" required placeholder="e.g. Electricity" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Provider</label>
            <input name="provider" placeholder="optional" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
            <select name="type" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Amount</label>
            <input name="amount" type="number" step="0.01" placeholder="optional" className="w-24 rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Currency</label>
            <input name="currency" placeholder="USD" className="w-20 rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Billing cycle</label>
            <select name="billingCycle" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
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
          <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700">
            Add
          </button>
        </form>
      </section>
      )}
    </div>
  );
}

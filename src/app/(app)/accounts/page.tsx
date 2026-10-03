import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccount, deleteAccount } from "@/lib/actions/accounts";

const TYPES = ["utility", "internet", "insurance", "bank", "school", "medical", "other"];

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, people, assets] = await Promise.all([
    prisma.account.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "asc" },
      include: { person: { select: { name: true } }, asset: { select: { name: true } } },
    }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-stone-900">Accounts</h1>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
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
                  </p>
                </div>
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
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
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
          <button type="submit" className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-stone-800">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccount } from "@/lib/actions/accounts";

const TYPES = ["utility", "internet", "insurance", "bank", "school", "medical", "other"];

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [account, people, assets] = await Promise.all([
    prisma.account.findFirst({ where: { id, householdId: user.householdId } }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);
  if (!account) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/accounts" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to accounts
        </Link>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h1 className="text-lg font-medium text-stone-900 mb-4">Edit {account.name}</h1>
        <form action={updateAccount.bind(null, account.id)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input name="name" defaultValue={account.name} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Provider</label>
            <input name="provider" defaultValue={account.provider ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
            <select name="type" defaultValue={account.type} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Person</label>
            <select name="personId" defaultValue={account.personId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
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
            <select name="assetId" defaultValue={account.assetId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

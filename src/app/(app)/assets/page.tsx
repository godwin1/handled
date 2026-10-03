import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAsset, deleteAsset } from "@/lib/actions/assets";

const TYPES = ["home", "rental", "car", "scooter", "phone", "other"];

export default async function AssetsPage() {
  const user = await requireUser();
  const [assets, people] = await Promise.all([
    prisma.asset.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "asc" },
      include: { owner: { select: { name: true } } },
    }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-stone-900">Assets</h1>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        {assets.length === 0 ? (
          <p className="text-sm text-stone-400">No assets added yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{asset.name}</p>
                  <p className="text-xs text-stone-500 capitalize">
                    {asset.type}
                    {asset.owner && ` · ${asset.owner.name}`}
                    {asset.details && ` · ${asset.details}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/assets/${asset.id}/edit`} className="text-xs text-stone-400 hover:text-stone-900">
                    Edit
                  </Link>
                  <form action={deleteAsset.bind(null, asset.id)}>
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
        <h2 className="text-sm font-medium text-stone-900 mb-3">Add an asset</h2>
        <form action={createAsset} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input name="name" required placeholder="e.g. Honda Civic" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
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
            <label className="block text-xs font-medium text-stone-600 mb-1">Owner</label>
            <select name="ownerId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
              <option value="">—</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Details</label>
            <input name="details" placeholder="optional" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-stone-800">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

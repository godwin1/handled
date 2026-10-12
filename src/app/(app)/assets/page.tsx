import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAsset, deleteAsset } from "@/lib/actions/assets";
import { canEdit, canView } from "@/lib/permissions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/EmptyState";
import { Boxes } from "lucide-react";

const TYPES = ["home", "rental", "car", "scooter", "phone", "other"];

export default async function AssetsPage() {
  const user = await requireUser();
  if (!canView(user, "assets")) redirect("/dashboard");
  const editable = canEdit(user, "assets");

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
      <h1 className="font-display text-2xl font-medium text-stone-900">Assets</h1>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        {assets.length === 0 ? (
          <EmptyState icon={Boxes} label="No assets added yet." />
        ) : (
          <div className="divide-y divide-stone-100">
            {assets.map((asset) => (
              <div key={asset.id} className="flex items-center gap-3 justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={asset.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{asset.name}</p>
                    <p className="text-xs text-stone-500 capitalize truncate">
                      {asset.type}
                      {asset.owner && ` · ${asset.owner.name}`}
                      {asset.details && ` · ${asset.details}`}
                    </p>
                  </div>
                </div>
                {editable && (
                  <div className="flex items-center gap-3 shrink-0">
                    <Link href={`/assets/${asset.id}/edit`} className="text-xs text-stone-400 hover:text-stone-900">
                      Edit
                    </Link>
                    <form action={deleteAsset.bind(null, asset.id)}>
                      <button type="submit" className="text-xs text-stone-400 hover:text-rust-600">
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
      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Add an asset</h2>
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
          <button type="submit" className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2">
            Add
          </button>
        </form>
      </section>
      )}
    </div>
  );
}

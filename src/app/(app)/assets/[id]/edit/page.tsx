import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAsset } from "@/lib/actions/assets";
import { canEdit } from "@/lib/permissions";

const TYPES = ["home", "rental", "car", "scooter", "phone", "other"];

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!canEdit(user, "assets")) redirect("/assets");

  const [asset, people] = await Promise.all([
    prisma.asset.findFirst({ where: { id, householdId: user.householdId } }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);
  if (!asset) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/assets" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to assets
        </Link>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        <h1 className="text-lg font-medium text-stone-900 mb-4">Edit {asset.name}</h1>
        <form action={updateAsset.bind(null, asset.id)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input name="name" defaultValue={asset.name} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Type</label>
            <select name="type" defaultValue={asset.type} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Owner</label>
            <select name="ownerId" defaultValue={asset.ownerId ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
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
            <input name="details" defaultValue={asset.details ?? ""} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

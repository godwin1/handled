import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAsset } from "@/lib/actions/assets";

const TYPES = ["home", "rental", "car", "scooter", "phone", "other"];

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

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

      <section className="bg-white rounded-xl border border-stone-200 p-5">
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
          <button type="submit" className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-stone-800">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

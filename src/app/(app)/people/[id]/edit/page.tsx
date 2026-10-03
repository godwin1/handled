import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePerson } from "@/lib/actions/people";

const RELATIONSHIPS = ["self", "partner", "child", "parent", "other"];

function toInputDate(date: Date | null) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const person = await prisma.person.findFirst({ where: { id, householdId: user.householdId } });
  if (!person) notFound();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <Link href="/people" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back to people
        </Link>
      </div>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h1 className="text-lg font-medium text-stone-900 mb-4">Edit {person.name}</h1>
        <form action={updatePerson.bind(null, person.id)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input name="name" defaultValue={person.name} required className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Relationship</label>
            <select name="relationship" defaultValue={person.relationship} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Date of birth</label>
            <input type="date" name="dateOfBirth" defaultValue={toInputDate(person.dateOfBirth)} className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

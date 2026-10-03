import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPerson, deletePerson } from "@/lib/actions/people";

const RELATIONSHIPS = ["self", "partner", "child", "parent", "other"];

export default async function PeoplePage() {
  const user = await requireUser();
  const people = await prisma.person.findMany({
    where: { householdId: user.householdId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-medium text-stone-900">People</h1>

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        {people.length === 0 ? (
          <p className="text-sm text-stone-400">No one added yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {people.map((person) => (
              <div key={person.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{person.name}</p>
                  <p className="text-xs text-stone-500 capitalize">
                    {person.relationship}
                    {person.dateOfBirth && ` · born ${person.dateOfBirth.toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/people/${person.id}/edit`} className="text-xs text-stone-400 hover:text-stone-900">
                    Edit
                  </Link>
                  <form action={deletePerson.bind(null, person.id)}>
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

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Add a person</h2>
        <form action={createPerson} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Name</label>
            <input
              name="name"
              required
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Relationship</label>
            <select name="relationship" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm capitalize">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Date of birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

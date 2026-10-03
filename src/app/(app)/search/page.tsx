import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { canView } from "@/lib/permissions";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await requireUser();
  const query = (q ?? "").trim().toLowerCase();

  let results: { kind: string; href: string; title: string; subtitle: string }[] = [];

  if (query.length > 0) {
    const [people, assets, accounts, documents, tasks] = await Promise.all([
      canView(user, "people") ? prisma.person.findMany({ where: { householdId: user.householdId } }) : [],
      canView(user, "assets") ? prisma.asset.findMany({ where: { householdId: user.householdId } }) : [],
      canView(user, "accounts") ? prisma.account.findMany({ where: { householdId: user.householdId } }) : [],
      canView(user, "documents") ? prisma.document.findMany({ where: { householdId: user.householdId } }) : [],
      canView(user, "tasks") ? prisma.task.findMany({ where: { householdId: user.householdId } }) : [],
    ]);

    const matches = (...values: (string | null | undefined)[]) =>
      values.some((v) => v && v.toLowerCase().includes(query));

    results = [
      ...people
        .filter((p) => matches(p.name, p.relationship))
        .map((p) => ({ kind: "Person", href: "/people", title: p.name, subtitle: p.relationship })),
      ...assets
        .filter((a) => matches(a.name, a.type, a.details))
        .map((a) => ({ kind: "Asset", href: "/assets", title: a.name, subtitle: a.type })),
      ...accounts
        .filter((a) => matches(a.name, a.provider, a.type))
        .map((a) => ({ kind: "Account", href: "/accounts", title: a.name, subtitle: a.provider ?? a.type })),
      ...documents
        .filter((d) => matches(d.title, d.merchant, d.type, d.policyNumber))
        .map((d) => ({ kind: "Document", href: `/documents/${d.id}`, title: d.title, subtitle: d.type })),
      ...tasks
        .filter((t) => matches(t.title, t.type))
        .map((t) => ({ kind: "Task", href: `/tasks/${t.id}`, title: t.title, subtitle: t.type })),
    ];
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-medium text-stone-900">Search</h1>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="car insurance, Maya passport, wifi contract…"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          autoFocus
        />
        <button type="submit" className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700">
          Search
        </button>
      </form>

      {query.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5">
          {results.length === 0 ? (
            <p className="text-sm text-stone-400">No matches for &ldquo;{q}&rdquo;.</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {results.map((r, i) => (
                <Link key={i} href={r.href} className="flex items-center justify-between py-3 hover:bg-stone-50 -mx-5 px-5">
                  <div>
                    <p className="text-sm font-medium text-stone-900">{r.title}</p>
                    <p className="text-xs text-stone-500 capitalize">{r.subtitle}</p>
                  </div>
                  <Badge label={r.kind} />
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

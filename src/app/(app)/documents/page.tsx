import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/Badge";
import { UploadForm } from "@/components/UploadForm";

export default async function DocumentsPage() {
  const user = await requireUser();
  const [documents, people, assets, accounts] = await Promise.all([
    prisma.document.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "desc" },
      include: {
        person: { select: { name: true } },
        asset: { select: { name: true } },
        account: { select: { name: true } },
      },
    }),
    prisma.person.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.asset.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
    prisma.account.findMany({ where: { householdId: user.householdId }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-stone-900">Documents</h1>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="text-sm font-medium text-stone-900 mb-3">Upload a document</h2>
        <UploadForm people={people} assets={assets} accounts={accounts} />
      </section>

      <section className="bg-white rounded-xl border border-stone-200 p-5">
        {documents.length === 0 ? (
          <p className="text-sm text-stone-400">No documents yet.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between py-3 hover:bg-stone-50 -mx-5 px-5"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                    <Badge label={doc.type} />
                    {doc.person && <span>{doc.person.name}</span>}
                    {doc.asset && <span>{doc.asset.name}</span>}
                    {doc.account && <span>{doc.account.name}</span>}
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    doc.status === "PENDING_REVIEW" ? "text-amber-600" : "text-stone-400"
                  }`}
                >
                  {doc.status === "PENDING_REVIEW" ? "Needs review" : "Filed"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryIcon } from "@/components/CategoryIcon";
import { EmptyState } from "@/components/EmptyState";
import { FileText } from "lucide-react";
import { UploadForm } from "@/components/UploadForm";
import { canEdit, canView } from "@/lib/permissions";

export default async function DocumentsPage() {
  const user = await requireUser();
  if (!canView(user, "documents")) redirect("/dashboard");
  const editable = canEdit(user, "documents");

  const [documents, people, assets, accounts] = await Promise.all([
    prisma.document.findMany({
      where: { householdId: user.householdId, status: { not: "SUPERSEDED" } },
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
      <h1 className="font-display text-2xl font-medium text-stone-900">Documents</h1>

      {editable && (
      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Upload a document</h2>
        <UploadForm people={people} assets={assets} accounts={accounts} />
      </section>
      )}

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        {documents.length === 0 ? (
          <EmptyState icon={FileText} label="No documents yet." />
        ) : (
          <div className="divide-y divide-stone-100">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center gap-3 justify-between py-3 hover:bg-stone-50 -mx-5 px-5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon type={doc.type} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900 truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                      <span className="capitalize">{doc.type}</span>
                      {doc.person && <span>· {doc.person.name}</span>}
                      {doc.asset && <span>· {doc.asset.name}</span>}
                      {doc.account && <span>· {doc.account.name}</span>}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
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

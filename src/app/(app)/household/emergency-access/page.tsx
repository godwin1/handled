import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HouseholdPageHeader } from "@/components/HouseholdPageHeader";
import { CreateLegacyAccessLinkForm } from "@/components/CreateLegacyAccessLinkForm";
import { RevokeLegacyAccessLinkButton } from "@/components/RevokeLegacyAccessLinkButton";
import { setLegacyAccessWaitDays } from "@/lib/actions/legacyAccess";

export default async function EmergencyAccessPage() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/household");

  const legacyAccessLinks = await prisma.legacyAccessLink.findMany({
    where: { householdId: user.householdId },
    include: { requests: { orderBy: { requestedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <HouseholdPageHeader householdName={user.household.name} isAdmin={user.isAdmin} />

      <section className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Emergency access</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Give someone outside your household (a spouse, an executor) a link they can use to request access if
            you're ever unreachable. A request waits before taking effect, and every admin gets an email with a
            one-click way to cancel it.
          </p>
        </div>

        <form action={setLegacyAccessWaitDays} className="flex items-center gap-2 text-sm">
          <label className="text-stone-600">Wait</label>
          <input
            type="number"
            name="waitDays"
            min={3}
            max={90}
            defaultValue={user.household.legacyAccessMinWaitDays}
            className="w-16 rounded-md border border-stone-300 px-2 py-1 text-sm bg-white"
          />
          <span className="text-stone-600">days before granting</span>
          <button type="submit" className="text-xs text-accent-600 hover:text-accent-700 font-medium">
            Save
          </button>
        </form>

        {legacyAccessLinks.length > 0 && (
          <div className="divide-y divide-stone-200/70 border-t border-stone-200/70 pt-2">
            {legacyAccessLinks.map((link) => {
              const latest = link.requests[0];
              return (
                <div key={link.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm text-stone-900">
                      {link.contactName} <span className="text-stone-400">· {link.contactEmail}</span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {!latest && "No request yet"}
                      {latest?.status === "pending" && `Requested — grants ${latest.grantAt.toLocaleDateString()} unless cancelled`}
                      {latest?.status === "granted" && `Granted ${latest.grantedAt?.toLocaleDateString()}`}
                      {latest?.status === "cancelled" && "Last request was cancelled"}
                    </p>
                  </div>
                  {latest?.status !== "granted" && (
                    <RevokeLegacyAccessLinkButton linkId={link.id} name={link.contactName} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <CreateLegacyAccessLinkForm />
      </section>
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LABELS, PLAN_PRICES, PLAN_LIMITS, getEffectivePlan } from "@/lib/billing";
import { UpgradeButton } from "@/components/UpgradeButton";
import { ManageBillingButton } from "@/components/ManageBillingButton";

function formatLimit(n: number) {
  return n === Infinity ? "Unlimited" : String(n);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const user = await requireUser();

  const [memberCount, documentCount] = await Promise.all([
    prisma.user.count({ where: { householdId: user.householdId } }),
    prisma.document.count({ where: { householdId: user.householdId } }),
  ]);

  const effectivePlan = getEffectivePlan(user.household);
  const limits = PLAN_LIMITS[effectivePlan];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Billing</h1>
        <p className="text-sm text-stone-500 mt-1">Your household's plan and usage.</p>
      </div>

      {success === "true" && (
        <div className="bg-sage-100 border border-sage-600/30 rounded-md p-3 text-sm text-sage-700">
          Subscription activated. It may take a few seconds to show up below.
        </div>
      )}

      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-stone-900">Current plan</h2>
            <p className="text-lg font-display text-stone-900 mt-1">
              {user.household.legacyFree ? "Family (grandfathered — free forever)" : PLAN_LABELS[effectivePlan]}
            </p>
            {!user.household.legacyFree && user.household.subscriptionStatus === "past_due" && (
              <p className="text-xs text-rust-600 mt-1">Your last payment failed — update your payment method.</p>
            )}
          </div>
          {!user.household.legacyFree && effectivePlan !== "free" && user.isAdmin && <ManageBillingButton />}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm border-t border-stone-100 pt-4">
          <div>
            <p className="text-stone-500 text-xs">Members</p>
            <p className="text-stone-900">
              {memberCount} / {formatLimit(limits.members)}
            </p>
          </div>
          <div>
            <p className="text-stone-500 text-xs">Documents</p>
            <p className="text-stone-900">
              {documentCount} / {formatLimit(limits.documents)}
            </p>
          </div>
          <div>
            <p className="text-stone-500 text-xs">AI extractions / month</p>
            <p className="text-stone-900">{formatLimit(limits.aiExtractions)}</p>
          </div>
        </div>
      </section>

      {!user.household.legacyFree && (
        <section className="grid sm:grid-cols-2 gap-4">
          {(["plus", "family"] as const)
            .filter((plan) => plan !== effectivePlan)
            .map((plan) => (
              <div key={plan} className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-stone-900">{PLAN_LABELS[plan]}</h3>
                  <p className="text-lg font-display text-stone-900">${PLAN_PRICES[plan]}/mo</p>
                </div>
                <ul className="text-xs text-stone-500 space-y-1">
                  <li>{formatLimit(PLAN_LIMITS[plan].members)} members</li>
                  <li>{formatLimit(PLAN_LIMITS[plan].documents)} documents</li>
                  <li>{formatLimit(PLAN_LIMITS[plan].aiExtractions)} AI extractions/month</li>
                  {PLAN_LIMITS[plan].sharing && <li>Document sharing outside household</li>}
                  {PLAN_LIMITS[plan].auditLog && <li>Activity log</li>}
                </ul>
                {user.isAdmin ? (
                  <UpgradeButton plan={plan} />
                ) : (
                  <p className="text-xs text-stone-400">Ask your household admin to upgrade.</p>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  );
}

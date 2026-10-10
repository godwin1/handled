import Link from "next/link";
import { PLAN_LABELS, PLAN_PRICES, PLAN_LIMITS } from "@/lib/billing";

export const metadata = { title: "Pricing — Handled" };

function formatLimit(n: number) {
  return n === Infinity ? "Unlimited" : String(n);
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Link href="/" className="font-display text-xl font-medium text-accent-600">
          Handled
        </Link>

        <div className="mt-8 text-center">
          <h1 className="font-display text-3xl font-medium text-stone-900">Pricing</h1>
          <p className="mt-2 text-sm text-stone-500">Start free. Upgrade when your household outgrows it.</p>
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-5">
          {(["free", "plus", "family"] as const).map((plan) => (
            <div key={plan} className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6 space-y-4">
              <div>
                <h2 className="text-sm font-medium text-stone-900">{PLAN_LABELS[plan]}</h2>
                <p className="text-2xl font-display text-stone-900 mt-1">
                  ${PLAN_PRICES[plan]}
                  <span className="text-sm text-stone-400">/mo</span>
                </p>
              </div>
              <ul className="text-sm text-stone-600 space-y-1.5">
                <li>{formatLimit(PLAN_LIMITS[plan].members)} household members</li>
                <li>{formatLimit(PLAN_LIMITS[plan].documents)} documents</li>
                <li>{formatLimit(PLAN_LIMITS[plan].aiExtractions)} AI extractions/month</li>
                <li className={PLAN_LIMITS[plan].sharing ? "" : "text-stone-300"}>Document sharing outside household</li>
                <li className={PLAN_LIMITS[plan].auditLog ? "" : "text-stone-300"}>Activity log</li>
                <li>Tasks, reminders, push notifications, security (2FA, etc.) — all plans</li>
              </ul>
              <Link
                href="/signup"
                className="block text-center rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700"
              >
                Get started
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-stone-400 text-center">
          Already have a household?{" "}
          <Link href="/billing" className="underline hover:text-stone-600">
            Manage your plan
          </Link>
        </p>
      </div>
    </div>
  );
}

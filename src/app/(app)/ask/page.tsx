import { requireUser } from "@/lib/auth";
import { AskForm } from "@/components/AskForm";
import { getLimits } from "@/lib/billing";

export default async function AskPage() {
  const user = await requireUser();
  const limit = getLimits(user.household).aiChatQueries;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-medium text-stone-900">Ask</h1>
        <p className="text-sm text-stone-500 mt-1">
          {limit === Infinity ? "Unlimited questions on your plan." : `${limit} questions/month on your plan.`}
        </p>
      </div>
      <section className="bg-white rounded-2xl border border-stone-200/70 shadow-[0_1px_2px_rgba(42,33,26,0.04),0_6px_16px_-4px_rgba(42,33,26,0.08)] p-5">
        <AskForm />
      </section>
    </div>
  );
}

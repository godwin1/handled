"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession } from "@/lib/actions/billing";

export function UpgradeButton({
  plan,
  monthlyPrice,
  annualPrice,
}: {
  plan: "plus" | "family";
  monthlyPrice: number;
  annualPrice: number;
}) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`rounded-full px-2.5 py-1 ${interval === "month" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`rounded-full px-2.5 py-1 ${interval === "year" ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"}`}
        >
          Annual (save ~17%)
        </button>
      </div>
      <p className="text-lg font-display text-stone-900">
        ${interval === "month" ? monthlyPrice : annualPrice}
        <span className="text-sm text-stone-400">/{interval === "month" ? "mo" : "yr"}</span>
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => createCheckoutSession(plan, interval))}
        className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-1.5 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Redirecting…" : "Upgrade"}
      </button>
    </div>
  );
}

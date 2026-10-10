"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "@/lib/actions/billing";

export function UpgradeButton({ plan }: { plan: "plus" | "family" }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => createCheckoutSession(plan))}
      className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-1.5 hover:bg-accent-700 disabled:opacity-60"
    >
      {pending ? "Redirecting…" : "Upgrade"}
    </button>
  );
}

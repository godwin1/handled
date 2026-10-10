"use client";

import { useTransition } from "react";
import { createPortalSession } from "@/lib/actions/billing";

export function ManageBillingButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => createPortalSession())}
      className="text-xs text-stone-500 hover:text-accent-600 disabled:opacity-60 shrink-0"
    >
      {pending ? "Redirecting…" : "Manage billing"}
    </button>
  );
}

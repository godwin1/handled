"use client";

import { useActionState } from "react";
import Link from "next/link";
import { confirmEnrollment } from "@/lib/actions/twoFactor";

export function ConfirmEnrollmentForm() {
  const [state, formAction, pending] = useActionState(confirmEnrollment, undefined);

  if (state?.backupCodes) {
    return (
      <div className="space-y-3">
        <div className="bg-sage-100 border border-sage-600/30 rounded-md p-3">
          <p className="text-sm font-medium text-sage-700 mb-2">2FA is enabled. Save these backup codes.</p>
          <p className="text-xs text-stone-600 mb-2">
            Each works once if you lose access to your authenticator app. Store them somewhere safe — this is the
            only time they&apos;re shown.
          </p>
          <div className="grid grid-cols-2 gap-1 font-mono text-xs text-stone-800">
            {state.backupCodes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
        <Link
          href="/account"
          className="inline-block rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
        >
          Done
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">6-digit code</label>
        <input
          name="code"
          autoComplete="one-time-code"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm tracking-widest"
        />
      </div>
      {state?.error && <p className="text-xs text-rust-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
      >
        {pending ? "Confirming…" : "Confirm and enable"}
      </button>
    </form>
  );
}

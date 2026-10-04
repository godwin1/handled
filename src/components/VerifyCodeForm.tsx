"use client";

import { useActionState } from "react";
import { verifyLoginCode } from "@/lib/actions/twoFactor";

export function VerifyCodeForm() {
  const [state, formAction, pending] = useActionState(verifyLoginCode, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Code</label>
        <input
          name="code"
          autoComplete="one-time-code"
          autoFocus
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-accent-400/50"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}

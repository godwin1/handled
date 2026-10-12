"use client";

import { useActionState, useState, useTransition } from "react";
import { verifyLoginCode, requestTwoFactorRecovery } from "@/lib/actions/twoFactor";

export function VerifyCodeForm() {
  const [state, formAction, pending] = useActionState(verifyLoginCode, undefined);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recoveryPending, startRecovery] = useTransition();

  return (
    <div className="space-y-4">
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
        {state?.error && <p className="text-sm text-rust-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent-600 text-white text-sm font-medium py-2 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
        >
          {pending ? "Verifying…" : "Verify"}
        </button>
      </form>

      {recoverySent ? (
        <p className="text-xs text-stone-500">
          If you have access to your email, check it for a link to disable two-factor authentication and sign back
          in.
        </p>
      ) : showRecovery ? (
        <div className="text-xs text-stone-500 space-y-2">
          <p>This will turn off two-factor authentication for your account so you can sign in without it.</p>
          <button
            type="button"
            disabled={recoveryPending}
            onClick={() => startRecovery(async () => {
              await requestTwoFactorRecovery();
              setRecoverySent(true);
            })}
            className="font-medium text-accent-600 hover:text-accent-700 disabled:opacity-60"
          >
            {recoveryPending ? "Sending…" : "Email me a recovery link"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowRecovery(true)}
          className="text-xs text-stone-400 hover:text-accent-600"
        >
          Lost access to your authenticator and backup codes?
        </button>
      )}
    </div>
  );
}

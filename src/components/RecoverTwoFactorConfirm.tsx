"use client";

import { useState, useTransition } from "react";
import { completeTwoFactorRecovery } from "@/lib/actions/twoFactor";

export function RecoverTwoFactorConfirm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        This will turn off two-factor authentication on your account so you can sign in with just your password.
        You can set it back up again once you&rsquo;re in.
      </p>
      {error && <p className="text-sm text-rust-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await completeTwoFactorRecovery(token);
            if (result?.error) setError(result.error);
          })
        }
        className="w-full rounded-full bg-accent-600 text-white text-sm font-medium py-2 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
      >
        {pending ? "Disabling…" : "Disable two-factor authentication"}
      </button>
    </div>
  );
}

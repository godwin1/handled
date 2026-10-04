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
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await completeTwoFactorRecovery(token);
            if (result?.error) setError(result.error);
          })
        }
        className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Disabling…" : "Disable two-factor authentication"}
      </button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { adminResetMemberTwoFactor } from "@/lib/actions/household";

export function ResetTwoFactorButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Turn off two-factor authentication for ${name}? Use this if they're locked out — they can set it back up once they're in.`
          )
        )
          return;
        startTransition(() => adminResetMemberTwoFactor(userId));
      }}
      className="text-xs text-stone-500 hover:text-accent-600 disabled:opacity-40"
    >
      {pending ? "Resetting…" : "Reset their 2FA (locked out)"}
    </button>
  );
}

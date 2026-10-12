"use client";

import { useState, useTransition } from "react";
import { resendVerificationEmail } from "@/lib/actions/auth";

export function VerifyEmailBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 sm:px-6 py-2">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-amber-900">
          {message ?? "Confirm your email address to finish securing your account."}
        </p>
        {!message && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await resendVerificationEmail();
                setMessage(result?.error ?? "Verification email sent — check your inbox.");
              })
            }
            className="shrink-0 text-xs font-medium text-amber-900 underline hover:no-underline disabled:opacity-60"
          >
            {pending ? "Sending…" : "Resend email"}
          </button>
        )}
      </div>
    </div>
  );
}

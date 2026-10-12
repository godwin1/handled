"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { verifyEmail } from "@/lib/actions/auth";

export function VerifyEmailConfirm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-sage-700">Your email is confirmed.</p>
        <Link
          href="/dashboard"
          className="inline-block rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
        >
          Continue to Handled
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">Confirm this is your email address for your Handled account.</p>
      {error && <p className="text-sm text-rust-600">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await verifyEmail(token);
            if (result?.error) setError(result.error);
            else setDone(true);
          })
        }
        className="w-full rounded-full bg-accent-600 text-white text-sm font-medium py-2 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
      >
        {pending ? "Confirming…" : "Confirm email"}
      </button>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Reset your password</h2>

      {state?.sent ? (
        <p className="text-sm text-stone-600">
          If an account exists for that email, we&apos;ve sent a link to reset your password. It expires in 1 hour.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/50"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-4 text-sm text-stone-500 text-center">
        <Link href="/login" className="text-accent-600 font-medium underline hover:text-accent-700">
          Back to log in
        </Link>
      </p>
    </div>
  );
}

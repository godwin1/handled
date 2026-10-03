"use client";

import { useActionState } from "react";
import Link from "next/link";
import { logIn } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(logIn, undefined);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/70 shadow-sm p-6">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Log in</h2>
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
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-stone-700">Password</label>
            <Link href="/forgot-password" className="text-xs text-stone-500 hover:text-stone-900">
              Forgot password?
            </Link>
          </div>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/50"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-500 text-center">
        No account yet?{" "}
        <Link href="/signup" className="text-accent-600 font-medium underline hover:text-accent-700">
          Create a household
        </Link>
      </p>
    </div>
  );
}

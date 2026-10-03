"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, undefined);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-stone-900 mb-4">Create your household</h2>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your name</label>
          <input
            name="name"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Household name</label>
          <input
            name="householdName"
            placeholder="e.g. The Smith Home"
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-stone-900 text-white text-sm font-medium py-2 hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create household"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-stone-900 font-medium underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/lib/actions/household";

export function JoinForm({ token, prefilledEmail }: { token: string; prefilledEmail: string | null }) {
  const action = acceptInvite.bind(null, token);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Your name</label>
        <input
          name="name"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/50"
        />
      </div>
      {prefilledEmail ? (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            value={prefilledEmail}
            readOnly
            className="w-full rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/50"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400/50"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Joining…" : "Join household"}
      </button>
    </form>
  );
}

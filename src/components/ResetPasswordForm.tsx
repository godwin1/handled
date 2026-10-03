"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const action = resetPassword.bind(null, token);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">New password</label>
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
        {pending ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}

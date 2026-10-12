"use client";

import { useActionState, useState } from "react";
import { disableTwoFactor } from "@/lib/actions/twoFactor";

export function DisableTwoFactorForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(disableTwoFactor, undefined);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-stone-500 hover:text-rust-600">
        Disable two-factor authentication
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 bg-stone-50 border border-stone-200 rounded-md p-3">
      <label className="block text-xs font-medium text-stone-600">Confirm your password to disable 2FA</label>
      <input
        name="password"
        type="password"
        required
        className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
      />
      {state?.error && <p className="text-xs text-rust-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rust-600 text-white text-xs font-medium px-4 py-1.5 shadow-sm shadow-rust-600/25 transition-all duration-150 hover:bg-rust-700 hover:shadow-md hover:shadow-rust-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-600/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
        >
          {pending ? "Disabling…" : "Disable 2FA"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-stone-500 hover:text-stone-900">
          Cancel
        </button>
      </div>
    </form>
  );
}

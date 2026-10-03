"use client";

import { useActionState, useState } from "react";
import { createInvite } from "@/lib/actions/household";

export function InviteForm() {
  const [state, formAction, pending] = useActionState(createInvite, undefined);
  const [copied, setCopied] = useState(false);

  const token = state && "token" in state ? state.token : null;
  const error = state && "error" in state ? state.error : null;
  const link = token && typeof window !== "undefined" ? `${window.location.origin}/join/${token}` : null;

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Email (optional)</label>
          <input
            name="email"
            type="email"
            placeholder="partner@example.com"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-900 text-white text-sm font-medium px-4 py-1.5 hover:bg-stone-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create invite link"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {link && (
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-md px-3 py-2">
          <input readOnly value={link} className="flex-1 bg-transparent text-sm text-stone-700 outline-none" />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}

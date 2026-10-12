"use client";

import { useActionState, useState } from "react";
import { createDocumentShareLink } from "@/lib/actions/documentShare";

export function ShareDocumentForm({ documentId }: { documentId: string }) {
  const action = createDocumentShareLink.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Link expires in</label>
          <select name="expiryDays" defaultValue="7" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
        >
          {pending ? "Creating…" : "Create share link"}
        </button>
      </form>

      {state?.error && <p className="text-sm text-rust-600">{state.error}</p>}

      {state?.link && (
        <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-md px-3 py-2">
          <input readOnly value={state.link} className="flex-1 bg-transparent text-sm text-stone-700 outline-none" />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(state.link!);
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

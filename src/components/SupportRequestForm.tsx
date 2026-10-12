"use client";

import { useActionState } from "react";
import { submitSupportRequest } from "@/lib/actions/support";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Billing" },
  { value: "security", label: "Security concern" },
  { value: "bug", label: "Something's not working" },
];

export function SupportRequestForm() {
  const [state, formAction, pending] = useActionState(submitSupportRequest, undefined);

  if (state?.sent) {
    return <p className="text-sm text-sage-700">Thanks — we got your message and will reply by email.</p>;
  }

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Topic</label>
        <select name="topic" defaultValue="general" className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm">
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Message</label>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="What's going on?"
          className="w-full rounded-md border border-stone-300 px-3 py-1.5 text-sm"
        />
      </div>
      {state?.error && <p className="text-sm text-rust-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-1.5 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100 disabled:hover:shadow-sm"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

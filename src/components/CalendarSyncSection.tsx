"use client";

import { useState, useTransition } from "react";
import { regenerateCalendarUrl } from "@/lib/actions/calendar";

export function CalendarSyncSection({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-stone-900">Calendar sync</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Subscribe in Google Calendar, Apple Calendar, or Outlook to see task due dates and document expirations
          alongside the rest of your calendar. Updates automatically — no need to re-subscribe.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-md px-3 py-2">
        <input readOnly value={url} className="flex-1 bg-transparent text-sm text-stone-700 outline-none" />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("This invalidates the old link — anywhere it's already subscribed will stop updating.")) return;
          startTransition(async () => setUrl(await regenerateCalendarUrl()));
        }}
        className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-60"
      >
        {pending ? "Regenerating…" : "Regenerate link"}
      </button>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { askHouseholdQuestion } from "@/lib/actions/aiChat";

type Exchange = { question: string; answer?: string; error?: string };

export function AskForm() {
  const [history, setHistory] = useState<Exchange[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const question = input.trim();
    if (!question) return;
    setInput("");
    setHistory((h) => [...h, { question }]);
    startTransition(async () => {
      const result = await askHouseholdQuestion(question);
      setHistory((h) => h.map((item, i) => (i === h.length - 1 ? { ...item, ...result } : item)));
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        {history.length === 0 && (
          <p className="text-sm text-stone-400">
            Ask things like &ldquo;when does the car insurance renew&rdquo; or &ldquo;what&rsquo;s due this
            month.&rdquo; Answered only from your household&rsquo;s own data.
          </p>
        )}
        {history.map((item, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-sm font-medium text-stone-900">{item.question}</p>
            {item.error ? (
              <p className="text-sm text-red-600">{item.error}</p>
            ) : item.answer ? (
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{item.answer}</p>
            ) : (
              <p className="text-sm text-stone-400">Thinking…</p>
            )}
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your household…"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-2 hover:bg-accent-700 disabled:opacity-60"
        >
          {pending ? "Asking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

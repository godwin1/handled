"use client";

import { useTransition } from "react";
import { deletePerson } from "@/lib/actions/people";

export function RemovePersonButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${name}? They'll be unlinked from any tasks, documents, and accounts.`)) return;
        startTransition(() => deletePerson(id));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

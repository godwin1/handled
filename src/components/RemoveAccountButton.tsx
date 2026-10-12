"use client";

import { useTransition } from "react";
import { deleteAccount } from "@/lib/actions/accounts";

export function RemoveAccountButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${name}? This can't be undone.`)) return;
        startTransition(() => deleteAccount(id));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

"use client";

import { useTransition } from "react";
import { deleteAsset } from "@/lib/actions/assets";

export function RemoveAssetButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${name}? Any linked tasks, documents, and accounts will be unlinked.`)) return;
        startTransition(() => deleteAsset(id));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

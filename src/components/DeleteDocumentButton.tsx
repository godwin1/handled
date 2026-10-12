"use client";

import { useTransition } from "react";
import { deleteDocument } from "@/lib/actions/documents";

export function DeleteDocumentButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete "${title}"? The uploaded file can't be recovered.`)) return;
        startTransition(() => deleteDocument(id));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

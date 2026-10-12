"use client";

import { useTransition } from "react";
import { deleteTask } from "@/lib/actions/tasks";

export function DeleteTaskButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        startTransition(() => deleteTask(id));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

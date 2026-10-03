"use client";

import { useTransition } from "react";
import { removeMember } from "@/lib/actions/household";

export function RemoveMemberButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${name} from this household? They'll lose access immediately.`)) return;
        startTransition(() => removeMember(userId));
      }}
      className="text-xs text-stone-400 hover:text-red-600 disabled:opacity-40"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

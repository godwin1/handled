"use client";

import { useTransition } from "react";
import { revokeLegacyAccessLink } from "@/lib/actions/legacyAccess";

export function RevokeLegacyAccessLinkButton({ linkId, name }: { linkId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Revoke the emergency access link for ${name}? This cancels any pending request too.`)) return;
        startTransition(() => revokeLegacyAccessLink(linkId));
      }}
      className="text-xs text-stone-400 hover:text-rust-600 disabled:opacity-40"
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}

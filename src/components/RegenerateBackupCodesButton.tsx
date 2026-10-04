"use client";

import { useState, useTransition } from "react";
import { regenerateBackupCodes } from "@/lib/actions/twoFactor";

export function RegenerateBackupCodesButton() {
  const [pending, startTransition] = useTransition();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (codes) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-md p-3 space-y-2">
        <p className="text-xs text-stone-600">
          New backup codes generated — your old ones no longer work. Save these somewhere safe; each works once.
        </p>
        <div className="grid grid-cols-2 gap-1 font-mono text-xs text-stone-800">
          {codes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button type="button" onClick={() => setCodes(null)} className="text-xs text-accent-600 hover:text-accent-700">
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await regenerateBackupCodes();
            if ("error" in result) setError(result.error);
            else setCodes(result.backupCodes);
          });
        }}
        className="text-xs text-stone-500 hover:text-accent-600 disabled:opacity-60"
      >
        {pending ? "Generating…" : "Generate new backup codes"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

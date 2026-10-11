"use client";

import { useState, useTransition } from "react";
import { requestLegacyAccess } from "@/lib/actions/legacyAccess";

export function RequestLegacyAccessButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ grantAt?: Date; error?: string; alreadyGranted?: boolean } | null>(null);

  if (result?.grantAt) {
    return (
      <p className="text-sm text-stone-700">
        Request submitted. Unless cancelled, you'll get access on <strong>{result.grantAt.toLocaleDateString()}</strong> —
        check your email then for a link to set your password.
      </p>
    );
  }
  if (result?.alreadyGranted) {
    return (
      <p className="text-sm text-stone-700">
        You already have access — check your email for the link to set your password, or just log in if you've
        already done that.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("This starts the emergency access process. Only continue if you need it.")) return;
          startTransition(async () => setResult(await requestLegacyAccess(token)));
        }}
        className="w-full rounded-md bg-accent-600 text-white text-sm font-medium py-2 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Requesting…" : "Request access"}
      </button>
      {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
    </div>
  );
}

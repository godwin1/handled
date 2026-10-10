"use client";

import { useState, useTransition } from "react";
import { sendTestPush } from "@/lib/actions/push";

export function SendTestPushButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await sendTestPush();
            if (result.skipped) setMessage("Push notifications aren't configured on the server yet.");
            else if (result.sent === 0) setMessage("No devices registered - open the app on your phone first.");
            else setMessage(`Sent to ${result.sent} device${result.sent === 1 ? "" : "s"}. Check your phone.`);
          });
        }}
        className="text-xs text-stone-500 hover:text-accent-600 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send me a test notification"}
      </button>
      {message && <p className="text-xs text-stone-500 mt-1">{message}</p>}
    </div>
  );
}

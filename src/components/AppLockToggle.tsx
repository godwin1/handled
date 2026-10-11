"use client";

import { useEffect, useState } from "react";

export function AppLockToggle() {
  const [checked, setChecked] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        setChecked(true);
        return;
      }
      const { isBiometryAvailable, isAppLockEnabled } = await import("@/lib/appLock");
      setAvailable(await isBiometryAvailable());
      setEnabled(isAppLockEnabled());
      setChecked(true);
    })();
  }, []);

  if (!checked || !available) return null;

  return (
    <label className="flex items-center gap-2 text-sm text-stone-700">
      <input
        type="checkbox"
        checked={enabled}
        onChange={async (e) => {
          const { setAppLockEnabled } = await import("@/lib/appLock");
          setAppLockEnabled(e.target.checked);
          setEnabled(e.target.checked);
        }}
        className="rounded border-stone-300"
      />
      Require Face ID / fingerprint to open the app
    </label>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * Gates the authenticated app behind a biometric prompt when the user has
 * turned app lock on (see AppLockToggle, in Account). No-ops entirely on
 * web and on native when the preference is off, and renders nothing at all
 * until that check resolves - avoids a flash of real content before a
 * locked device's prompt appears.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let resumeHandle: { remove: () => void } | undefined;

    (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) {
        setChecked(true);
        return;
      }

      const { isAppLockEnabled, requireBiometricUnlock } = await import("@/lib/appLock");
      if (!isAppLockEnabled()) {
        setChecked(true);
        return;
      }

      setLocked(true);
      const unlockedOnLaunch = await requireBiometricUnlock();
      setLocked(!unlockedOnLaunch);
      setChecked(true);

      const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
      resumeHandle = await BiometricAuth.addResumeListener(async () => {
        if (!isAppLockEnabled()) return;
        setLocked(true);
        const unlockedOnResume = await requireBiometricUnlock();
        setLocked(!unlockedOnResume);
      });
    })();

    return () => resumeHandle?.remove();
  }, []);

  if (!checked) return null;

  return (
    <>
      {children}
      {locked && (
        <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="font-display text-lg text-stone-900">Handled is locked</p>
            <button
              type="button"
              onClick={async () => {
                const { requireBiometricUnlock } = await import("@/lib/appLock");
                setLocked(!(await requireBiometricUnlock()));
              }}
              className="rounded-full bg-accent-600 text-white text-sm font-medium px-5 py-2 shadow-sm shadow-accent-600/25 transition-all duration-150 hover:bg-accent-700 hover:shadow-md hover:shadow-accent-600/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </>
  );
}

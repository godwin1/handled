"use client";

import { Capacitor } from "@capacitor/core";

// Purely a per-device UI preference, not server data - different devices
// have different biometric hardware/enrollment, and losing it on
// reinstall is harmless, so localStorage is the right place for it (never
// synced, never read by the server).
const STORAGE_KEY = "handled:appLockEnabled";

export function isAppLockEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAppLockEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore (private browsing / storage disabled)
  }
}

export async function isBiometryAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function requireBiometricUnlock(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const { BiometricAuth } = await import("@aparajita/capacitor-biometric-auth");
    await BiometricAuth.authenticate({ reason: "Unlock Handled", allowDeviceCredential: true });
    return true;
  } catch {
    return false;
  }
}

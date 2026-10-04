import { registerPlugin } from "@capacitor/core";

// Backed by ios/App/App/FcmTokenPlugin.swift - bridges the real FCM token
// on iOS, since @capacitor/push-notifications only exposes the raw APNs
// token there. No Android counterpart needed: Android's 'registration'
// event already gives a real FCM token directly.
export interface FcmTokenPlugin {
  getToken(): Promise<{ token: string }>;
}

export const FcmToken = registerPlugin<FcmTokenPlugin>("FcmToken");

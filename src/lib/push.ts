import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

let app: App | null | undefined;

// Initialized lazily (not at module load) so importing this file never
// throws when FIREBASE_SERVICE_ACCOUNT isn't configured yet - every caller
// just gets `skipped: true` back instead, the same pattern the Resend
// email functions use for RESEND_API_KEY.
function getApp(): App | null {
  if (app !== undefined) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    app = null;
    return app;
  }
  const existing = getApps();
  app = existing.length > 0 ? existing[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
  return app;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; skipped: boolean }> {
  const firebaseApp = getApp();
  if (!firebaseApp) return { sent: 0, skipped: true };

  const tokens = await prisma.pushToken.findMany({ where: { userId }, select: { id: true, token: true } });
  if (tokens.length === 0) return { sent: 0, skipped: false };

  const response = await getMessaging(firebaseApp).sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title: payload.title, body: payload.body },
    data: payload.url ? { url: payload.url } : undefined,
  });

  const staleIds: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
      staleIds.push(tokens[i].id);
    }
  });
  if (staleIds.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: staleIds } } }).catch(() => {});
  }

  return { sent: response.successCount, skipped: false };
}

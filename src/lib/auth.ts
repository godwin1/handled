import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rateLimit";

const SESSION_COOKIE = "handled_session";
const SESSION_DAYS = 30;
const PENDING_2FA_COOKIE = "handled_pending_2fa";
const PENDING_2FA_MINUTES = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const h = await headers();
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      userAgent: h.get("user-agent") ?? null,
      ipAddress: await getClientIp(),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentSessionId() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const sessionId = await getCurrentSessionId();
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { include: { household: true, permissions: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

// Bridges "password verified" and "session created" when 2FA is enabled.
// Deliberately a separate cookie/table from the real session so a pending
// 2FA record can never be mistaken for (or upgraded into) an authenticated
// session just by its presence.
export async function createPendingTwoFactor(userId: string) {
  const expiresAt = new Date(Date.now() + PENDING_2FA_MINUTES * 60 * 1000);
  const pending = await prisma.pendingTwoFactor.create({ data: { userId, expiresAt } });
  const store = await cookies();
  store.set(PENDING_2FA_COOKIE, pending.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return pending.id;
}

export async function getPendingTwoFactorUser() {
  const store = await cookies();
  const pendingId = store.get(PENDING_2FA_COOKIE)?.value;
  if (!pendingId) return null;

  const pending = await prisma.pendingTwoFactor.findUnique({
    where: { id: pendingId },
    include: { user: true },
  });
  if (!pending || pending.expiresAt < new Date()) {
    if (pending) await prisma.pendingTwoFactor.delete({ where: { id: pending.id } }).catch(() => {});
    return null;
  }
  return pending;
}

export async function clearPendingTwoFactor() {
  const store = await cookies();
  const pendingId = store.get(PENDING_2FA_COOKIE)?.value;
  if (pendingId) {
    await prisma.pendingTwoFactor.delete({ where: { id: pendingId } }).catch(() => {});
  }
  store.delete(PENDING_2FA_COOKIE);
}

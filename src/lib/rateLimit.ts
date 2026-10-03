import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Counts only what recordAttempt() wrote for this key - callers decide what
// counts as an "attempt" (e.g. login only records failures, so successful
// logins never count against the limit).
export async function isRateLimited(key: string, maxAttempts: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  const count = await prisma.rateLimitAttempt.count({ where: { key, createdAt: { gte: windowStart } } });
  return count >= maxAttempts;
}

export async function recordAttempt(key: string): Promise<void> {
  await prisma.rateLimitAttempt.create({ data: { key } });
}

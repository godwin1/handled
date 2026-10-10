import { prisma } from "@/lib/prisma";

export type Plan = "free" | "plus" | "family";

export const PLAN_LIMITS: Record<Plan, { members: number; documents: number; aiExtractions: number; sharing: boolean; auditLog: boolean }> = {
  free: { members: 2, documents: 20, aiExtractions: 10, sharing: false, auditLog: false },
  plus: { members: 5, documents: 200, aiExtractions: 100, sharing: true, auditLog: false },
  family: { members: Infinity, documents: Infinity, aiExtractions: Infinity, sharing: true, auditLog: true },
};

export const PLAN_LABELS: Record<Plan, string> = { free: "Free", plus: "Plus", family: "Family" };
export const PLAN_PRICES: Record<Plan, number> = { free: 0, plus: 6.99, family: 14.99 };

type BillableHousehold = { plan: string; legacyFree: boolean };

function normalizePlan(plan: string): Plan {
  return plan === "plus" || plan === "family" ? plan : "free";
}

// Source of truth for "which plan is this" is always the Stripe price on
// the subscription, never metadata we'd have to keep in sync separately -
// see the webhook handler.
export function priceIdToPlan(priceId: string | undefined | null): Plan {
  if (priceId && priceId === process.env.STRIPE_PRICE_FAMILY) return "family";
  if (priceId && priceId === process.env.STRIPE_PRICE_PLUS) return "plus";
  return "free";
}

// Grandfathered households get full access forever regardless of `plan` -
// see the migration that introduced legacyFree for why.
export function getEffectivePlan(household: BillableHousehold): Plan {
  return household.legacyFree ? "family" : normalizePlan(household.plan);
}

export function getLimits(household: BillableHousehold) {
  return PLAN_LIMITS[getEffectivePlan(household)];
}

export async function canAddMember(householdId: string, household: BillableHousehold): Promise<boolean> {
  const limit = getLimits(household).members;
  if (limit === Infinity) return true;
  const count = await prisma.user.count({ where: { householdId } });
  return count < limit;
}

export async function canAddDocument(householdId: string, household: BillableHousehold): Promise<boolean> {
  const limit = getLimits(household).documents;
  if (limit === Infinity) return true;
  const count = await prisma.document.count({ where: { householdId } });
  return count < limit;
}

// Quota resets each calendar month - counts documents created since the 1st,
// which also doubles as "how many uploads have run through AI extraction"
// since every upload consumes one call today.
export async function hasAiExtractionQuota(householdId: string, household: BillableHousehold): Promise<boolean> {
  const limit = getLimits(household).aiExtractions;
  if (limit === Infinity) return true;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const count = await prisma.document.count({ where: { householdId, createdAt: { gte: startOfMonth } } });
  return count < limit;
}

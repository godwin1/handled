"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { currentOrigin } from "@/lib/url";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}

const PRICE_IDS: Record<"plus" | "family", string | undefined> = {
  plus: process.env.STRIPE_PRICE_PLUS,
  family: process.env.STRIPE_PRICE_FAMILY,
};

// Only admins manage the household's subscription - same reasoning as
// everything else in household.ts that affects the whole group.
export async function createCheckoutSession(plan: "plus" | "family") {
  const user = await requireUser();
  requireAdmin(user);

  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`No Stripe price configured for plan "${plan}"`);

  const stripe = getStripe();
  const origin = await currentOrigin();

  let customerId = user.household.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.household.name,
      metadata: { householdId: user.householdId },
    });
    customerId = customer.id;
    await prisma.household.update({ where: { id: user.householdId }, data: { stripeCustomerId: customerId } });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?success=true`,
    cancel_url: `${origin}/billing`,
  });

  if (!session.url) throw new Error("Stripe didn't return a checkout URL");
  redirect(session.url);
}

// Stripe's hosted portal covers upgrade/downgrade between Plus and Family,
// cancellation, payment method updates, and invoice history - no custom UI
// needed for any of that.
export async function createPortalSession() {
  const user = await requireUser();
  requireAdmin(user);

  if (!user.household.stripeCustomerId) redirect("/billing");

  const stripe = getStripe();
  const origin = await currentOrigin();

  const session = await stripe.billingPortal.sessions.create({
    customer: user.household.stripeCustomerId,
    return_url: `${origin}/billing`,
  });

  redirect(session.url);
}

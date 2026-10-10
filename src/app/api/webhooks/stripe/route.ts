import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { priceIdToPlan } from "@/lib/billing";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

// Resolves the household purely from the Stripe customer ID (persisted on
// Household.stripeCustomerId at checkout time) and the subscription's
// current price - never from metadata we'd have to keep in sync on every
// plan change made through the portal.
async function syncSubscription(stripe: Stripe, subscriptionOrId: string | Stripe.Subscription) {
  const sub = typeof subscriptionOrId === "string" ? await stripe.subscriptions.retrieve(subscriptionOrId) : subscriptionOrId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const household = await prisma.household.findUnique({ where: { stripeCustomerId: customerId } });
  if (!household) {
    console.error(`Stripe webhook: no household found for customer ${customerId}`);
    return;
  }

  const isActive = sub.status === "active" || sub.status === "trialing";
  const priceId = sub.items.data[0]?.price.id;
  // Stripe moved current_period_end to the item level (multi-item
  // subscriptions can have different billing cycles per item) - it's no
  // longer on the Subscription object itself.
  const periodEnd = sub.items.data[0]?.current_period_end;

  await prisma.household.update({
    where: { id: household.id },
    data: {
      plan: isActive ? priceIdToPlan(priceId) : "free",
      stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
      subscriptionStatus: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          await syncSubscription(stripe, session.subscription as string);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(stripe, event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

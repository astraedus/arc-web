import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { activateLifetimePurchase } from "@/lib/billing/ltd";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, getStripeWebhookSecret());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook signature verification failed.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      await activateLifetimePurchase({ sessionId: session.id });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to process the checkout session.";

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

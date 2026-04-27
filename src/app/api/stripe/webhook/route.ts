import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { activateLifetimePurchase } from "@/lib/billing/ltd";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    // Do not echo Stripe's verifier message back; could leak which secret
    // version is in use or other internal hints.
    console.warn("[stripe-webhook] signature verification failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      await activateLifetimePurchase({ sessionId: session.id });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error("[stripe-webhook] activation failed", {
        sessionId: session.id,
        eventId: event.id,
        reason,
      });

      // Tell Stripe to retry on transient infra errors. For permanent
      // application-side rejects (price not allowed, replay against another
      // user) ack 200 so Stripe doesn't keep retrying a stuck event.
      const isPermanentReject =
        reason.startsWith("LTD_SESSION_PRICE_NOT_ALLOWED") ||
        reason.startsWith("LTD_SESSION_BOUND_TO_DIFFERENT_USER") ||
        reason.startsWith("LTD_SESSION_WRONG_MODE");

      if (isPermanentReject) {
        return NextResponse.json({ received: true, dropped: true });
      }
      return NextResponse.json({ error: "internal" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

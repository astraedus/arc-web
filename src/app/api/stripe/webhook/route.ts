import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { activateLifetimePurchase } from "@/lib/billing/ltd";
import { sendLtdClaimEmail } from "@/lib/email/resend";
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

    let activation;
    try {
      activation = await activateLifetimePurchase({ sessionId: session.id });
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

    // Race-fix: only ONE of webhook/redirect wins createUser and sees
    // (isNewUser:true, claimToken:non-null). That winner sends the email.
    // The loser sees (isNewUser:false, claimToken:null) and does nothing.
    // Without this, if the webhook wins, the buyer gets no email at all.
    if (activation.isNewUser && activation.claimToken) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        new URL(request.url).origin;
      const claimUrl = new URL("/signup", baseUrl);
      claimUrl.searchParams.set("ltd", "true");
      claimUrl.searchParams.set("claim_token", activation.claimToken);
      claimUrl.searchParams.set("prefill", activation.email);

      try {
        await sendLtdClaimEmail({
          to: activation.email,
          claimUrl: claimUrl.toString(),
        });
      } catch (error) {
        // Email delivery failed but the purchase + claim token are recorded.
        // Log loudly; an operator can manually resend via Resend dashboard
        // until the resend route ships.
        console.error("[stripe-webhook] claim email send failed", {
          eventId: event.id,
          userId: activation.userId,
          reason: error instanceof Error ? error.message : String(error),
        });
        // Still ack 200: the purchase landed, this is a deliverability issue
        // not a Stripe-event-processing issue. Retrying the webhook won't fix
        // a Resend outage.
      }
    }
  }

  return NextResponse.json({ received: true });
}

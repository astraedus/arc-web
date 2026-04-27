import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateLifetimePurchase } from "@/lib/billing/ltd";
import { sendLtdClaimEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(
      new URL("/lifetime/check-email?error=ltd_missing_session", request.url),
      { status: 303 }
    );
  }

  let activation;
  try {
    activation = await activateLifetimePurchase({ sessionId });
  } catch (error) {
    // Don't echo session_id into the redirect URL (sensitive); log only.
    console.error("[ltd-activate] activation failed", {
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(
      new URL("/lifetime/check-email?error=ltd_activation_failed", request.url),
      { status: 303 }
    );
  }

  // Signed-in path: ONLY redirect to /app if the signed-in user matches the
  // user the Stripe session activated. Existing-account purchasers (no claim
  // token minted) get the cosmetic redirect; the activation already happened
  // server-side so they're already entitled.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id === activation.userId) {
    return NextResponse.redirect(new URL("/app?ltd=true", request.url), {
      status: 303,
    });
  }

  // New-user path: claim token was minted server-side. Send it via email to
  // the Stripe customer email (a channel the purchaser controls), and
  // redirect the browser to a "check your email" page with NO bearer in URL.
  if (activation.isNewUser && activation.claimToken) {
    const claimUrl = new URL("/signup", request.url);
    claimUrl.searchParams.set("ltd", "true");
    claimUrl.searchParams.set("claim_token", activation.claimToken);
    claimUrl.searchParams.set("prefill", activation.email);

    try {
      await sendLtdClaimEmail({
        to: activation.email,
        claimUrl: claimUrl.toString(),
      });
    } catch (error) {
      console.error("[ltd-activate] claim email send failed", {
        userId: activation.userId,
        reason: error instanceof Error ? error.message : String(error),
      });
      // Surface a generic failure (the claim is still valid for ~60 minutes;
      // we expose a manual resend route as followup if this fires often).
      return NextResponse.redirect(
        new URL("/lifetime/check-email?error=ltd_email_send_failed", request.url),
        { status: 303 }
      );
    }
  }

  // Whether we just emailed or the user already had an account, the purchase
  // is recorded server-side. Send them to the confirmation page.
  return NextResponse.redirect(
    new URL("/lifetime/check-email", request.url),
    { status: 303 }
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateLifetimePurchase } from "@/lib/billing/ltd";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(
      new URL("/signup?error=ltd_missing_session", request.url),
      { status: 303 }
    );
  }

  let activation;
  try {
    activation = await activateLifetimePurchase({ sessionId });
  } catch (error) {
    console.error("[ltd-activate] activation failed", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.redirect(
      new URL("/signup?error=ltd_activation_failed", request.url),
      { status: 303 }
    );
  }

  // Signed-in path: ONLY redirect to /app if the signed-in user matches the
  // user the Stripe session activated. This keeps the IDOR fix airtight even
  // for the cosmetic redirect: a signed-in attacker pasting somebody else's
  // session_id never lands in a "you have LTD" state on their own account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && user.id === activation.userId) {
    return NextResponse.redirect(new URL("/app?ltd=true", request.url), {
      status: 303,
    });
  }

  // Otherwise: signed-out (or signed-in-as-someone-else) -> hand off to /signup
  // with the prefill email and (for new users) the single-use claim token.
  // session_id never appears in any URL the browser sees.
  const redirectUrl = new URL("/signup", request.url);
  redirectUrl.searchParams.set("ltd", "true");
  redirectUrl.searchParams.set("prefill", activation.email);
  if (activation.claimToken) {
    redirectUrl.searchParams.set("claim_token", activation.claimToken);
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}

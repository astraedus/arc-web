import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { activateLifetimePurchase } from "@/lib/billing/ltd";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/signup?error=ltd_missing_session", request.url));
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const activation = await activateLifetimePurchase({
      preferredUserId: user?.id,
      sessionId,
    });

    if (user) {
      return NextResponse.redirect(new URL("/app?ltd=true", request.url), {
        status: 303,
      });
    }

    const redirectUrl = new URL("/signup", request.url);
    redirectUrl.searchParams.set("ltd", "true");
    redirectUrl.searchParams.set("prefill", activation.email);

    if (activation.requiresClaim) {
      redirectUrl.searchParams.set("session_id", sessionId);
    }

    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch {
    return NextResponse.redirect(new URL("/signup?error=ltd_activation_failed", request.url), {
      status: 303,
    });
  }
}

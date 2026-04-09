import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase redirects here after the email confirmation link is clicked.
// We exchange the `code` param for a session cookie, then redirect to /app.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/app";
  // Prevent open redirect: only allow paths starting with /app
  const next = rawNext.startsWith("/app") ? rawNext : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong; bounce back to the landing with an error flag.
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`);
}

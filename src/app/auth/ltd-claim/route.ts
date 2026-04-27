import { NextResponse, type NextRequest } from "next/server";
import { completeLifetimeClaim } from "@/lib/billing/ltd";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 12;
const GENERIC_CLAIM_ERROR =
  "We couldn't complete your lifetime activation. Try the link from your purchase email again, or contact support@arc.diary.";

export async function POST(request: NextRequest) {
  // Same-origin guard (defense in depth alongside the claim-token).
  if (!isSameOrigin(request)) {
    console.warn("[ltd-claim] rejected cross-origin POST", {
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });
    return NextResponse.json({ error: GENERIC_CLAIM_ERROR }, { status: 400 });
  }

  let body: { email?: string; password?: string; claimToken?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: GENERIC_CLAIM_ERROR }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const claimToken = body.claimToken?.trim();

  if (!email || !password || !claimToken) {
    return NextResponse.json({ error: GENERIC_CLAIM_ERROR }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  try {
    await completeLifetimeClaim({ email, password, claimToken });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log the real reason, return a generic message to avoid email/state
    // enumeration via differing error text.
    console.error("[ltd-claim] failed", {
      email,
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: GENERIC_CLAIM_ERROR }, { status: 400 });
  }
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    // No Origin header = not a cross-origin browser request. Server-to-server
    // calls (e.g. CLI tests) are also fine; the claim_token itself is the
    // strong authn.
    return true;
  }
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return originUrl.host === requestUrl.host;
  } catch {
    return false;
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { completeLifetimeClaim } from "@/lib/billing/ltd";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    sessionId?: string;
  };

  const email = body.email?.trim();
  const password = body.password?.trim();
  const sessionId = body.sessionId?.trim();

  if (!email || !password || !sessionId) {
    return NextResponse.json(
      { error: "Missing email, password, or checkout session." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  try {
    await completeLifetimeClaim({ email, password, sessionId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to finish the LTD signup.";
    const status =
      message.includes("already linked") || message.includes("Sign in")
        ? 409
        : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

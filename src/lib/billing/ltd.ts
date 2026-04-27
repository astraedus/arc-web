import type Stripe from "stripe";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const HARDCODED_PRODUCT_KEY = "arc-mirror-ltd";
const CLAIM_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 minutes

function getAllowedPriceIds(): Set<string> {
  const raw = process.env.STRIPE_LTD_PRICE_IDS ?? "";
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error("STRIPE_LTD_PRICE_IDS not configured");
  }
  return new Set(ids);
}

type AuthUserLookupRow = {
  user_id: string;
  ltd_purchased_at: string | null;
};

type EnsuredUser = {
  isNewUser: boolean;
  userId: string;
  claimToken: string | null;
};

export type LtdActivationResult = {
  email: string;
  isNewUser: boolean;
  userId: string;
  claimToken: string | null;
};

/**
 * Activate an LTD purchase from a verified-paid Stripe checkout session.
 * Called from the redirect handler AND from the Stripe webhook (idempotent).
 * Single source of truth on which user a paid session is bound to: the
 * Stripe customer email. Caller-supplied user IDs are NOT trusted.
 */
export async function activateLifetimePurchase({
  sessionId,
}: {
  sessionId: string;
}): Promise<LtdActivationResult> {
  const session = await retrievePaidLtdSession(sessionId);
  const email = getSessionEmail(session);
  const purchasedAt = stripeTimestampToIso(session.created);
  const amountCents = session.amount_total ?? session.amount_subtotal ?? null;
  const admin = createAdminClient();

  const ensuredUser = await ensureUserForEmail(admin, email, purchasedAt);

  // Hardened insert: never overwrite the user_id of an existing row.
  // If the same stripe_session_id was already recorded under a different
  // user, that is a replay attempt and must fail loudly.
  const { error: insertError } = await admin.from("purchases").insert({
    amount_cents: amountCents,
    created_at: purchasedAt,
    product: HARDCODED_PRODUCT_KEY,
    stripe_session_id: session.id,
    user_id: ensuredUser.userId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique violation on stripe_session_id. Verify same user (idempotent
      // re-run from webhook + redirect) and otherwise reject as replay.
      const { data: existing } = await admin
        .from("purchases")
        .select("user_id")
        .eq("stripe_session_id", session.id)
        .maybeSingle<{ user_id: string }>();

      if (!existing || existing.user_id !== ensuredUser.userId) {
        throw new Error("LTD_SESSION_BOUND_TO_DIFFERENT_USER");
      }
    } else {
      throw new Error(`LTD_PURCHASE_INSERT_FAILED: ${insertError.message}`);
    }
  }

  await stampLtdPurchasedAt(admin, ensuredUser.userId, purchasedAt);

  return {
    email,
    isNewUser: ensuredUser.isNewUser,
    userId: ensuredUser.userId,
    claimToken: ensuredUser.claimToken,
  };
}

/**
 * Complete an LTD claim for a brand-new user. Authenticated by the
 * single-use claim token minted at activation, NOT by the Stripe session ID.
 * The session ID is treated as sensitive bearer material and never leaves
 * the server.
 */
export async function completeLifetimeClaim({
  email,
  password,
  claimToken,
}: {
  email: string;
  password: string;
  claimToken: string;
}): Promise<{ userId: string; email: string }> {
  const admin = createAdminClient();
  const normalizedEmail = normalizeEmail(email);

  const { data: lookup, error: lookupError } = await admin.rpc(
    "find_auth_user_by_email",
    { user_email: normalizedEmail }
  );
  if (lookupError) throw new Error("LTD_CLAIM_FAILED");

  const row = (Array.isArray(lookup) ? lookup[0] : lookup) as
    | AuthUserLookupRow
    | null;
  if (!row) throw new Error("LTD_CLAIM_FAILED");

  const { data: userData, error: userError } =
    await admin.auth.admin.getUserById(row.user_id);
  if (userError || !userData.user) throw new Error("LTD_CLAIM_FAILED");

  const meta = userData.user.app_metadata ?? {};
  const storedHash =
    typeof meta.ltd_claim_token_hash === "string"
      ? meta.ltd_claim_token_hash
      : null;
  const expiresAtRaw =
    typeof meta.ltd_claim_expires_at === "string"
      ? meta.ltd_claim_expires_at
      : null;
  const isClaimPending = meta.ltd_claim_pending === true;

  if (!isClaimPending || !storedHash || !expiresAtRaw) {
    throw new Error("LTD_CLAIM_FAILED");
  }

  const expiresAtMs = Date.parse(expiresAtRaw);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
    throw new Error("LTD_CLAIM_EXPIRED");
  }

  const presentedHash = sha256Hex(claimToken);
  if (!constantTimeEqualHex(presentedHash, storedHash)) {
    throw new Error("LTD_CLAIM_FAILED");
  }

  const nextMetadata: Record<string, unknown> = { ...meta };
  delete nextMetadata.ltd_claim_token_hash;
  delete nextMetadata.ltd_claim_expires_at;
  delete nextMetadata.ltd_claim_pending;
  nextMetadata.ltd = true;

  const { error: updateError } = await admin.auth.admin.updateUserById(
    row.user_id,
    {
      password,
      app_metadata: nextMetadata,
      email_confirm: true,
    }
  );
  if (updateError) throw new Error("LTD_CLAIM_FAILED");

  return { userId: row.user_id, email: normalizedEmail };
}

// --- internals ---

async function retrievePaidLtdSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "line_items.data.price"],
  });

  if (session.payment_status !== "paid") {
    throw new Error("LTD_SESSION_NOT_PAID");
  }
  if (session.mode !== "payment") {
    throw new Error("LTD_SESSION_WRONG_MODE");
  }

  const allowed = getAllowedPriceIds();
  const lineItems = session.line_items?.data ?? [];
  const purchasedAllowedSku = lineItems.some((item) => {
    const priceId = item.price?.id;
    return typeof priceId === "string" && allowed.has(priceId);
  });

  if (!purchasedAllowedSku) {
    throw new Error("LTD_SESSION_PRICE_NOT_ALLOWED");
  }

  return session;
}

function getSessionEmail(session: Stripe.Checkout.Session): string {
  const expandedCustomer =
    typeof session.customer === "object" &&
    session.customer &&
    !("deleted" in session.customer && session.customer.deleted)
      ? session.customer
      : null;

  const email =
    session.customer_details?.email ??
    session.customer_email ??
    expandedCustomer?.email ??
    null;

  if (!email) {
    throw new Error("LTD_SESSION_MISSING_EMAIL");
  }

  return normalizeEmail(email);
}

async function ensureUserForEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  purchasedAt: string
): Promise<EnsuredUser> {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    return { isNewUser: false, userId: existing.user_id, claimToken: null };
  }

  const claimToken = randomBytes(32).toString("hex"); // 256-bit, single-use
  const claimTokenHash = sha256Hex(claimToken);
  const claimExpiresAt = new Date(Date.now() + CLAIM_TOKEN_TTL_MS).toISOString();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      app_metadata: {
        ltd: true,
        ltd_claim_pending: true,
        ltd_claim_token_hash: claimTokenHash,
        ltd_claim_expires_at: claimExpiresAt,
        ltd_purchased_at: purchasedAt,
      },
      email,
      email_confirm: true,
    });

  if (createError) {
    // Race window: a concurrent activation just created this user. Re-look up.
    const message = createError.message ?? "";
    if (
      message.toLowerCase().includes("already") ||
      message.toLowerCase().includes("exist")
    ) {
      const found = await findUserByEmail(admin, email);
      if (found) {
        return { isNewUser: false, userId: found.user_id, claimToken: null };
      }
    }
    throw new Error(`LTD_USER_CREATE_FAILED: ${createError.message}`);
  }
  if (!created.user) throw new Error("LTD_USER_CREATE_FAILED");

  return { isNewUser: true, userId: created.user.id, claimToken };
}

async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
): Promise<AuthUserLookupRow | null> {
  const { data, error } = await admin.rpc("find_auth_user_by_email", {
    user_email: email,
  });
  if (error) {
    throw new Error(`LTD_USER_LOOKUP_FAILED: ${error.message}`);
  }
  const row = (Array.isArray(data) ? data[0] : data) as
    | AuthUserLookupRow
    | null;
  return row ?? null;
}

async function stampLtdPurchasedAt(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  purchasedAt: string
): Promise<void> {
  const { error } = await admin.rpc("set_user_ltd_purchased_at", {
    purchased_at: purchasedAt,
    target_user_id: userId,
  });
  if (error) throw new Error(`LTD_STAMP_FAILED: ${error.message}`);
}

function normalizeEmail(email: string): string {
  return email.trim().normalize("NFKC").toLowerCase();
}

function stripeTimestampToIso(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Constant-time compare of two hex strings of expected equal length.
 * Returns false (non-throwing) on length mismatch so timing reveals nothing
 * beyond "lengths differ" (which they always shouldn't for our 32-byte tokens).
 */
function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

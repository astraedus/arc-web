import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

const DEFAULT_PRODUCT = "arc-mirror-ltd";

type AuthUserLookupRow = {
  user_id: string;
  ltd_purchased_at: string | null;
};

type SyncUserOptions = {
  claimPending?: boolean;
  password?: string;
};

export type LtdActivationResult = {
  email: string;
  isNewUser: boolean;
  requiresClaim: boolean;
  session: Stripe.Checkout.Session;
  userId: string;
};

export async function activateLifetimePurchase({
  preferredUserId,
  sessionId,
}: {
  preferredUserId?: string | null;
  sessionId: string;
}): Promise<LtdActivationResult> {
  const session = await retrievePaidCheckoutSession(sessionId);
  const email = getSessionEmail(session);
  const purchasedAt = stripeTimestampToIso(session.created);
  const amountCents = session.amount_total ?? session.amount_subtotal ?? null;
  const product = session.metadata?.product?.trim() || DEFAULT_PRODUCT;
  const admin = createAdminClient();

  const ensuredUser = preferredUserId
    ? { isNewUser: false, userId: preferredUserId }
    : await ensureUserForEmail(admin, email, purchasedAt);

  const { error: purchaseError } = await admin.from("purchases").upsert(
    {
      amount_cents: amountCents,
      created_at: purchasedAt,
      product,
      stripe_session_id: session.id,
      user_id: ensuredUser.userId,
    },
    {
      onConflict: "stripe_session_id",
    }
  );

  if (purchaseError) {
    throw new Error(`Failed to record LTD purchase: ${purchaseError.message}`);
  }

  await syncLtdUserState(admin, ensuredUser.userId, purchasedAt, {
    claimPending: ensuredUser.isNewUser ? true : undefined,
  });

  return {
    email,
    isNewUser: ensuredUser.isNewUser,
    requiresClaim: ensuredUser.isNewUser,
    session,
    userId: ensuredUser.userId,
  };
}

export async function completeLifetimeClaim({
  email,
  password,
  sessionId,
}: {
  email: string;
  password: string;
  sessionId: string;
}) {
  const activation = await activateLifetimePurchase({ sessionId });
  const normalizedInputEmail = normalizeEmail(email);

  if (activation.email !== normalizedInputEmail) {
    throw new Error("That email does not match the completed checkout session.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(activation.userId);

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to load the LTD user.");
  }

  if (data.user.app_metadata?.ltd_claim_pending !== true) {
    throw new Error(
      "This purchase is already linked to an Arc account. Sign in with that email instead."
    );
  }

  await syncLtdUserState(
    admin,
    activation.userId,
    activation.session.created
      ? stripeTimestampToIso(activation.session.created)
      : new Date().toISOString(),
    {
      claimPending: false,
      password,
    }
  );

  return {
    email: activation.email,
    userId: activation.userId,
  };
}

export async function retrievePaidCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer"],
  });

  if (session.payment_status !== "paid") {
    throw new Error("Stripe checkout session is not paid.");
  }

  return session;
}

function getSessionEmail(session: Stripe.Checkout.Session) {
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
    throw new Error("Stripe checkout session is missing a customer email.");
  }

  return normalizeEmail(email);
}

async function ensureUserForEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  purchasedAt: string
) {
  const existing = await findUserByEmail(admin, email);

  if (existing) {
    return {
      isNewUser: false,
      userId: existing.user_id,
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    app_metadata: {
      ltd: true,
      ltd_claim_pending: true,
      ltd_purchased_at: purchasedAt,
    },
    email,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create the LTD user.");
  }

  return {
    isNewUser: true,
    userId: data.user.id,
  };
}

async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
) {
  const { data, error } = await admin.rpc("find_auth_user_by_email", {
    user_email: email,
  });

  if (error) {
    throw new Error(`Failed to look up the LTD user: ${error.message}`);
  }

  const row = (Array.isArray(data) ? data[0] : data) as AuthUserLookupRow | null;
  return row ?? null;
}

async function syncLtdUserState(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  purchasedAt: string,
  options: SyncUserOptions = {}
) {
  const { error: stampError } = await admin.rpc("set_user_ltd_purchased_at", {
    purchased_at: purchasedAt,
    target_user_id: userId,
  });

  if (stampError) {
    throw new Error(`Failed to stamp LTD access: ${stampError.message}`);
  }

  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to fetch the LTD user.");
  }

  const currentMetadata = { ...(data.user.app_metadata ?? {}) };
  const nextMetadata: Record<string, unknown> = {
    ...currentMetadata,
    ltd: true,
    ltd_purchased_at:
      typeof currentMetadata.ltd_purchased_at === "string"
        ? currentMetadata.ltd_purchased_at
        : purchasedAt,
  };

  if (options.claimPending === true) {
    nextMetadata.ltd_claim_pending = true;
  }

  if (options.claimPending === false) {
    delete nextMetadata.ltd_claim_pending;
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    ...(options.password ? { password: options.password } : {}),
    app_metadata: nextMetadata,
    email_confirm: true,
  });

  if (updateError) {
    throw new Error(`Failed to update LTD user metadata: ${updateError.message}`);
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function stripeTimestampToIso(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}

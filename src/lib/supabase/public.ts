import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-less Supabase client for public read-only endpoints (OG image routes,
 * the public /r/[id] reflection view).
 *
 * If `SUPABASE_SERVICE_ROLE_KEY` is present we use it — public reads can then
 * see any row regardless of RLS. Otherwise we fall back to the anon key, which
 * works when RLS policies allow unauthenticated reads on the reflections table.
 *
 * The caller is responsible for any access-control filtering (e.g. checking
 * `isReflectionShareable`). Service role bypasses RLS, so treat its usage as
 * an explicit decision that the caller has validated shareability.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const key = serviceRole ?? anon;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-arc-client": "public-share",
      },
    },
  });
}

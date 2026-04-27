-- Arc Mirror LTD purchases schema.
--
-- Hosted-Supabase note: dashboard SQL runs as `postgres`, which is NOT the
-- owner of `auth.users` (that role is `supabase_auth_admin`). So we cannot
-- ALTER auth.users directly. Instead, LTD purchase state lives in a separate
-- `public.user_ltd_state` table keyed by user_id. The Auth Admin API (used
-- from the service-role server client) handles `app_metadata.ltd*` flags
-- separately; SQL is only responsible for the durable join/audit data.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product text not null,
  stripe_session_id text unique,
  amount_cents integer,
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_product_idx on public.purchases (product);

alter table public.purchases enable row level security;

-- Per-user LTD state (replaces the original auth.users.ltd_purchased_at column
-- design, which the hosted dashboard cannot apply).
create table if not exists public.user_ltd_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ltd_purchased_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.user_ltd_state enable row level security;

-- Service-definer lookup: finds an auth user by email and returns their LTD state
-- if any. Returns NULL ltd_purchased_at when the user exists but has no LTD row.
create or replace function public.find_auth_user_by_email(user_email text)
returns table (user_id uuid, ltd_purchased_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select
    users.id as user_id,
    state.ltd_purchased_at
  from auth.users as users
  left join public.user_ltd_state as state on state.user_id = users.id
  where users.email is not null
    and lower(users.email) = lower(user_email)
  limit 1;
$$;

-- Service-definer setter: upserts the LTD purchase timestamp for a user.
-- Idempotent: keeps the FIRST ltd_purchased_at if one already exists (so a
-- resync from the webhook never overwrites the original purchase moment).
create or replace function public.set_user_ltd_purchased_at(
  target_user_id uuid,
  purchased_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_ltd_state (user_id, ltd_purchased_at, updated_at)
    values (target_user_id, purchased_at, now())
    on conflict (user_id) do update
      set updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.find_auth_user_by_email(text) from public, anon, authenticated;
revoke all on function public.set_user_ltd_purchased_at(uuid, timestamptz) from public, anon, authenticated;

grant execute on function public.find_auth_user_by_email(text) to service_role;
grant execute on function public.set_user_ltd_purchased_at(uuid, timestamptz) to service_role;

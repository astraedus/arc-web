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

alter table auth.users
  add column if not exists ltd_purchased_at timestamptz;

create or replace function public.find_auth_user_by_email(user_email text)
returns table (user_id uuid, ltd_purchased_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select
    users.id as user_id,
    users.ltd_purchased_at
  from auth.users as users
  where users.email is not null
    and lower(users.email) = lower(user_email)
  limit 1;
$$;

create or replace function public.set_user_ltd_purchased_at(
  target_user_id uuid,
  purchased_at timestamptz default now()
)
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users as users
  set ltd_purchased_at = coalesce(users.ltd_purchased_at, purchased_at)
  where users.id = target_user_id;
$$;

revoke all on function public.find_auth_user_by_email(text) from public, anon, authenticated;
revoke all on function public.set_user_ltd_purchased_at(uuid, timestamptz) from public, anon, authenticated;

grant execute on function public.find_auth_user_by_email(text) to service_role;
grant execute on function public.set_user_ltd_purchased_at(uuid, timestamptz) to service_role;

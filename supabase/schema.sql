-- WillThisFit database schema (Supabase / Postgres)
-- Access model: the browser never talks to the database. Netlify functions verify the
-- Google sign-in and use the server-only secret key. RLS is on with no policies, so the
-- public (anon) and authenticated roles can read or write nothing.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_sub text unique not null,            -- Google's stable account id
  email text,
  name text,
  display_name text check (char_length(display_name) <= 40),
  leaderboard_opt_in boolean not null default false,
  measurements jsonb not null default '{}'::jsonb,  -- body, cm: bust, waist, hips, height, inside_leg
  is_reviewer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_id text,                               -- id from the app's brand list, when known
  brand_name text not null check (char_length(brand_name) between 1 and 80),
  garment_type text not null check (garment_type in ('tops','bottoms','one-piece','suit','outerwear','knitwear','shoes','other')),
  size_label text not null check (char_length(size_label) between 1 and 20),
  size_system text not null default 'uk' check (size_system in ('uk','eu','us','letter','waist-leg','other')),
  overall_fit text check (overall_fit in ('too_small','just_right','too_big')),
  fit_by_area jsonb not null default '{}'::jsonb,     -- {chest|waist|hips|length: 'tight'|'right'|'loose'}
  bought_year int check (bought_year between 1900 and 2100),
  garment_cm jsonb not null default '{}'::jsonb,       -- flat garment measurements, cm (level C)
  bought_on text check (bought_on in ('vinted','ebay','depop','charity','store','online','gift','other')),
  notes text check (char_length(notes) <= 500),
  status text not null default 'accepted' check (status in ('pending','accepted','rejected')),
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wardrobe_items_user_idx on public.wardrobe_items(user_id, created_at desc);
create index if not exists wardrobe_items_brand_idx on public.wardrobe_items(brand_id, size_label);

create table if not exists public.kudos_events (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  item_id uuid references public.wardrobe_items(id) on delete cascade,
  kind text not null,
  points int not null,
  created_at timestamptz not null default now(),
  unique (item_id, kind)
);
create index if not exists kudos_user_idx on public.kudos_events(user_id, created_at);

-- Leaderboards: only people who opted in, display name only.
create or replace view public.leaderboard_all with (security_invoker = true) as
  select u.id as user_id, coalesce(nullif(u.display_name,''), 'Anonymous') as display_name,
         sum(k.points)::int as kudos, count(distinct k.item_id)::int as items
  from public.kudos_events k join public.users u on u.id = k.user_id
  where u.leaderboard_opt_in
  group by u.id, u.display_name;

create or replace view public.leaderboard_month with (security_invoker = true) as
  select u.id as user_id, coalesce(nullif(u.display_name,''), 'Anonymous') as display_name,
         sum(k.points)::int as kudos, count(distinct k.item_id)::int as items
  from public.kudos_events k join public.users u on u.id = k.user_id
  where u.leaderboard_opt_in and k.created_at >= date_trunc('month', now())
  group by u.id, u.display_name;

-- Community fit signal: aggregate only, never individual rows.
create or replace view public.community_fit with (security_invoker = true) as
  select brand_id, size_label, garment_type,
         count(*)::int as reports,
         count(*) filter (where overall_fit = 'too_small')::int as too_small,
         count(*) filter (where overall_fit = 'just_right')::int as just_right,
         count(*) filter (where overall_fit = 'too_big')::int as too_big
  from public.wardrobe_items
  where status = 'accepted' and brand_id is not null and overall_fit is not null
  group by brand_id, size_label, garment_type;

alter table public.users enable row level security;
alter table public.wardrobe_items enable row level security;
alter table public.kudos_events enable row level security;

revoke all on public.users, public.wardrobe_items, public.kudos_events,
  public.leaderboard_all, public.leaderboard_month, public.community_fit from anon, authenticated;
grant select, insert, update, delete on public.users, public.wardrobe_items, public.kudos_events to service_role;
grant select on public.leaderboard_all, public.leaderboard_month, public.community_fit to service_role;
grant usage, select on sequence public.kudos_events_id_seq to service_role;

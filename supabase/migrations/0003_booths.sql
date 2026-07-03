-- Mirror of the static config in lib/booths.ts. Public read-only reference
-- data; booths ship via migration, never via client writes.
create table public.booths (
  id text primary key,
  kind text not null check (kind in ('place', 'seasonal', 'charter')),
  glyph text not null,
  name text not null,
  locale text not null,
  stamp_locale text not null,
  motto text not null,
  tagline text not null,
  place text not null,
  prefix text not null,
  accent text not null,
  paper text not null,
  -- pin position on the Route Map (map SVG viewBox 390x300); place-only
  map_x numeric,
  map_y numeric,
  -- when the pin is offset for legibility, the true projected location
  map_true_x numeric,
  map_true_y numeric,
  -- seasonal booths only issue during these months (0-11)
  season_months int[],
  season_returns text,
  -- "on location only" booths (e.g. Niagara), verified by geolocation
  exclusive_place text,
  exclusive_note text,
  exclusive_geo_lat numeric,
  exclusive_geo_lng numeric,
  exclusive_geo_radius_km numeric,
  prompts text[] not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.booths is
  'Mirror of lib/booths.ts BOOTHS. Public read-only; no client writes.';

alter table public.booths enable row level security;

create policy "booths are publicly readable"
  on public.booths for select
  to anon, authenticated
  using (true);

-- Deliberately no insert/update/delete policies: booths are shipped
-- content, not user data.

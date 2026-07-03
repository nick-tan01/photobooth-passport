-- Analytics events. Insert-only from the client; reads happen from the
-- dashboard/SQL editor, never the anon key (no SELECT policy exists here).
-- An analytics agent wires /api/signal to this table; this migration only
-- creates the table + policies.
create table public.events (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 128),
  session_id text check (char_length(session_id) <= 128),
  strip_id uuid references public.strips (id) on delete set null,
  share_slug text check (char_length(share_slug) <= 32),
  utm jsonb,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index events_name_idx on public.events (name);
create index events_created_at_idx on public.events (created_at);

alter table public.events enable row level security;

create policy "anyone can record an event"
  on public.events for insert
  to anon, authenticated
  with check (true);

-- Deliberately no select policy: no client reads of raw events.

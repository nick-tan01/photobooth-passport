-- A composited photo strip, cloud-saved so it can be opened by anyone via
-- a public share link. owner_id is nullable — null means a guest strip.
create table public.strips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  booth_id text not null check (char_length(booth_id) between 1 and 64),
  image_path text not null,
  caption text check (char_length(caption) <= 280),
  date_text text check (char_length(date_text) <= 64),
  serial text check (char_length(serial) <= 32),
  finish text not null default 'gloss' check (finish in ('gloss', 'silver', 'pearl', 'gold')),
  -- 8-char base62, crypto-random (see DESIGN.md "New-surface specs" /s/[slug]
  -- note); retry-on-conflict on insert is the collision strategy, not a
  -- filtered alphabet.
  share_slug text not null unique check (share_slug ~ '^[A-Za-z0-9]{8}$'),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.strips is
  'Cloud-saved photo strips. owner_id null = guest strip. image_path is the
   object path within the strips-public storage bucket.';

create index strips_owner_id_idx on public.strips (owner_id);
create index strips_share_slug_idx on public.strips (share_slug);

alter table public.strips enable row level security;

-- Public can read any strip explicitly marked public; signed-in owners can
-- also see their own strips regardless of is_public.
create policy "public strips are readable, owners see their own"
  on public.strips for select
  to anon, authenticated
  using (is_public = true or owner_id = auth.uid());

-- Guest uploads: anon may only insert rows with owner_id null. Signed-in
-- users may insert rows owned by themselves, or guest rows with a null
-- owner (e.g. uploading on someone else's behalf is not allowed either way).
create policy "anyone can insert a strip they legitimately own"
  on public.strips for insert
  to anon, authenticated
  with check (owner_id is null or owner_id = auth.uid());

create policy "owners can update their own strips"
  on public.strips for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners can delete their own strips"
  on public.strips for delete
  to authenticated
  using (owner_id = auth.uid());

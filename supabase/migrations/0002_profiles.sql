-- One row per signed-in user. Guests never get a row here.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per signed-in user, auto-created on first sign-in. Guests have no profile row.';

alter table public.profiles
  add constraint profiles_handle_format
  check (handle is null or handle ~ '^[a-z0-9_]{3,24}$');

alter table public.profiles
  add constraint profiles_display_name_length
  check (display_name is null or char_length(display_name) <= 60);

alter table public.profiles enable row level security;

-- Public read of handle/display_name (and id/created_at, neither of which
-- is sensitive — email/auth stay in auth.users and are never exposed here).
-- No column-level split is needed since no sensitive column exists on this
-- table.
create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a (handle-less) profile row on first sign-up so every future
-- owner_id foreign key always has a matching profile to join against.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

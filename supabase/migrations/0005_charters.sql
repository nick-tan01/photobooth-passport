-- Private event booths, unlocked by booking reference. Mirrors the shape of
-- lib/charters.ts CHARTERS (a Booth plus a `code`), plus event/redemption
-- metadata. Codes are never publicly readable — validation + redemption go
-- exclusively through the redeem_charter() RPC below.
create table public.charters (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  glyph text not null default 'bunting',
  name text not null,
  locale text not null,
  stamp_locale text not null,
  motto text not null,
  tagline text not null,
  place text not null,
  prefix text not null,
  accent text not null,
  paper text not null,
  prompts text[] not null default '{}',
  -- owner/event metadata
  event_name text,
  owner_email text,
  valid_from timestamptz,
  valid_to timestamptz,
  max_redemptions int,
  redemptions_count int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.charters is
  'Private event booths. Codes are NOT publicly readable; see redeem_charter().';

alter table public.charters
  add constraint charters_code_format check (code ~ '^[A-Z0-9]{3,20}$');

alter table public.charters
  add constraint charters_redemptions_count_nonneg check (redemptions_count >= 0);

alter table public.charters enable row level security;

-- Deliberately NO select policy: charter codes must never be enumerable or
-- readable via the anon/authenticated client. Everything below reads/writes
-- this table as the function owner (security definer), bypassing RLS.

create function public.redeem_charter(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_charter public.charters%rowtype;
begin
  select * into v_charter
  from public.charters
  where code = upper(trim(p_code));

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if v_charter.valid_from is not null and now() < v_charter.valid_from then
    return jsonb_build_object('ok', false, 'reason', 'not_yet_valid');
  end if;

  if v_charter.valid_to is not null and now() > v_charter.valid_to then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_charter.max_redemptions is not null
     and v_charter.redemptions_count >= v_charter.max_redemptions then
    return jsonb_build_object('ok', false, 'reason', 'exhausted');
  end if;

  update public.charters
    set redemptions_count = redemptions_count + 1
    where id = v_charter.id
    returning * into v_charter;

  return jsonb_build_object(
    'ok', true,
    'charter', jsonb_build_object(
      'id', v_charter.id,
      'code', v_charter.code,
      'kind', 'charter',
      'glyph', v_charter.glyph,
      'name', v_charter.name,
      'locale', v_charter.locale,
      'stampLocale', v_charter.stamp_locale,
      'motto', v_charter.motto,
      'tagline', v_charter.tagline,
      'place', v_charter.place,
      'prefix', v_charter.prefix,
      'accent', v_charter.accent,
      'paper', v_charter.paper,
      'prompts', v_charter.prompts
    )
  );
end;
$$;

comment on function public.redeem_charter(text) is
  'Validates a charter code (window + max redemptions) and atomically
   increments redemptions_count on success. Security definer so it can read
   the codes table despite no client SELECT policy existing on it. Called
   from POST /api/charters/redeem.';

revoke all on function public.redeem_charter(text) from public;
grant execute on function public.redeem_charter(text) to anon, authenticated;

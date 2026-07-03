-- Fix a check-then-update race on redeem_charter()'s max_redemptions cap
-- (see 0005_charters.sql lines 68-101 for the original definition). The
-- original body read redemptions_count, compared it to max_redemptions,
-- then incremented it in a separate UPDATE statement — under N concurrent
-- redemptions near the cap, all N could pass the read-time check before any
-- of them commit the increment, letting the cap be exceeded by up to N-1.
--
-- Fix: fold the cap check and the increment into a single conditional
-- UPDATE ... WHERE ... RETURNING, so Postgres's row-level locking makes the
-- check-and-increment atomic. A concurrent redemption that already
-- exhausted the cap between the initial SELECT and this UPDATE simply
-- returns no row, which is treated as 'exhausted' — same externally visible
-- outcome as before, just race-free. Signature and all other behavior
-- (not_found / not_yet_valid / expired reasons, returned charter shape,
-- grants) are unchanged.
create or replace function public.redeem_charter(p_code text)
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

  -- Atomic conditional increment: the cap check and the increment are one
  -- statement, so concurrent redemptions can no longer overrun
  -- max_redemptions. "No row returned" means the cap was hit by this check
  -- or a concurrent one between the SELECT above and here.
  update public.charters
    set redemptions_count = redemptions_count + 1
    where id = v_charter.id
      and (max_redemptions is null or redemptions_count < max_redemptions)
    returning * into v_charter;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'exhausted');
  end if;

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
   increments redemptions_count via a single conditional UPDATE ... WHERE
   ... RETURNING (no check-then-update race — see
   0013_charter_redeem_atomic.sql). Security definer so it can read the
   codes table despite no client SELECT policy existing on it. Called from
   POST /api/charters/redeem.';

-- CREATE OR REPLACE FUNCTION keeps the existing object (same OID, same
-- signature) rather than dropping/recreating it, so the 0005_charters.sql
-- grants below still apply — no need to repeat them:
--   revoke all on function public.redeem_charter(text) from public;
--   grant execute on function public.redeem_charter(text) to anon, authenticated;

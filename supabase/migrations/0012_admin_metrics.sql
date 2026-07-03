-- Phase 4 internal /admin "Bureau Ledger" — key-gated metrics RPC.
--
-- No service-role key exists in this project by design (see lib/supabase/
-- server.ts, lib/supabase/client.ts — anon key + RLS only, everywhere).
-- /admin can't just query the analytics_* views directly (they're revoked
-- from anon/authenticated in 0011_analytics_views.sql, deliberately, since
-- they aggregate over RLS-hidden `events` rows with no client SELECT
-- policy). Instead: a private admin_config table (RLS enabled, zero
-- policies — deny-all, exactly like public.charters in 0005_charters.sql)
-- holds a single sha256 hash of the office key, and a security-definer RPC
-- compares a caller-supplied key against that hash before reading the
-- analytics views on the caller's behalf. This mirrors the redeem_charter()
-- pattern (0005_charters.sql) exactly: "the key IS the gate" — anon/
-- authenticated may call the function, but it internally refuses to do
-- anything without a correct key.
--
-- admin_config.key_hash is seeded out-of-band by the orchestrator (never
-- committed to a migration file — see the comment on the table below).

create extension if not exists pgcrypto with schema extensions;

-- 1. admin_config — private, singleton, deny-all --------------------------
create table public.admin_config (
  id int primary key default 1,
  key_hash text not null,
  constraint admin_config_singleton check (id = 1)
);

comment on table public.admin_config is
  'Single-row table holding the sha256(hex) hash of the /admin office key.
   RLS enabled with NO policies (deny-all) — only admin_metrics(), a
   security-definer function, ever reads this table. Seeded out-of-band
   (e.g. `insert into admin_config (key_hash) values (encode(digest(''...'',
   ''sha256''), ''hex'')) on conflict (id) do update set key_hash =
   excluded.key_hash;` run once via the SQL editor / MCP execute_sql);
   never populated by a migration file.';

alter table public.admin_config enable row level security;
-- Deliberately no policies for any role/command: this table must never be
-- readable or writable via the anon/authenticated PostgREST API, even
-- indirectly. Only admin_metrics() below, running as the function owner,
-- can touch it. (Same "RLS enabled, zero policies" pattern as
-- public.charters — see 0010_fix_advisories.sql's note on that table; get_advisors
-- will likely flag this as INFO "rls_enabled_no_policy", which is the
-- intended state, not a gap.)

-- Belt-and-suspenders: also strip any default schema-level grants a fresh
-- Supabase project applies to public-schema tables, so a future privilege
-- change elsewhere can't accidentally expose this row without RLS being the
-- only thing standing in the way.
revoke all on public.admin_config from anon, authenticated, public;

-- 2. admin_metrics(p_key) — the one gated read ------------------------------
-- Constant-time-ish key check (hash compare, not a raw string compare) then,
-- on match only, bundles the four analytics_* views the /admin Bureau
-- Ledger needs (DESIGN.md "### /admin — Bureau Ledger (internal) — Phase 4
-- spec") into one jsonb payload. Returns null on ANY mismatch — including
-- "no key configured yet" — so a caller can never distinguish "the office
-- isn't set up" from "wrong key" (no oracle).
create function public.admin_metrics(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash text;
  v_result jsonb;
begin
  select key_hash into v_hash from public.admin_config where id = 1;

  if v_hash is null
     or p_key is null
     or char_length(p_key) = 0
     or encode(digest(p_key, 'sha256'), 'hex') <> v_hash then
    return null;
  end if;

  select jsonb_build_object(
    'kfactor', (
      select to_jsonb(k) from public.analytics_kfactor k
    ),
    'daily_funnel', (
      select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
      from (
        select *
        from public.analytics_daily_funnel
        where day >= (current_date - interval '30 days')
        order by day desc, event_name
      ) f
    ),
    'top_slugs', (
      select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
      from (
        select *
        from public.analytics_top_referring_slugs
        limit 20
      ) s
    ),
    'utm', (
      select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
      from public.analytics_utm_attribution u
    )
  )
  into v_result;

  return v_result;
end;
$$;

comment on function public.admin_metrics(text) is
  'Key-gated read of the analytics_* views (0011_analytics_views.sql) for
   the internal /admin Bureau Ledger. Security definer so it can read views
   that are revoked from anon/authenticated. Compares sha256(p_key) against
   admin_config.key_hash; returns null on any mismatch (including "not
   configured") rather than raising. Called from the /admin server
   component + its "present key" server action via
   supabase.rpc("admin_metrics", { p_key }).';

revoke all on function public.admin_metrics(text) from public;
grant execute on function public.admin_metrics(text) to anon, authenticated;

-- Advisor note: get_advisors will likely flag admin_metrics() as
-- "Public Can Execute SECURITY DEFINER Function" (WARN) — intentional, the
-- same accepted pattern as redeem_charter() (see 0010_fix_advisories.sql):
-- the key itself is the access control, checked as the very first thing
-- inside the function before any data is touched, and admin_config carries
-- no policies so it's otherwise unreachable even by the function's own
-- caller role.

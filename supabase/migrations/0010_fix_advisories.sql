-- Address findings from get_advisors(type=security) on objects created in
-- migrations 0001-0009 (see phase1-backend-report.md for the full list).

-- 1. "Public Bucket Allows Listing" (WARN): the original SELECT policy used
--    a bare `bucket_id = 'strips-public'` predicate, which — per Supabase's
--    storage RLS model — also permits *listing* every object in the bucket
--    via the Storage API, not just fetching a known path. Public buckets
--    already serve any known object path directly with no RLS check at all
--    (that's what bucket.public = true means — confirmed via Supabase docs
--    search), so replace the broad policy with one scoped to single-object
--    GET only (storage.allow_any_operation, confirmed present in this
--    project's storage schema), which keeps direct/public reads and any
--    future authenticated download() call working while blocking
--    enumeration of every strip ever uploaded.
--
--    Portability note: storage.allow_any_operation(...) is verified present
--    on THIS live project (mjusetxhmxiccdlspsep) but is not part of the
--    standard/documented storage schema across all Supabase versions.
--    Replaying migrations 0001-0013 on a fresh project (per 0001's stated
--    portability goal) may fail at this policy if the fresh project's
--    storage schema lacks it — if so, drop back to the plain
--    `bucket_id = 'strips-public'` predicate (using/with check (true) on
--    the bucket_id column alone) as a fallback rewrite; that reintroduces
--    listability but keeps object fetches working, and is what 0009
--    originally shipped.
drop policy if exists "public read of strips-public objects" on storage.objects;

create policy "strips-public objects are fetchable by path, not listable"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'strips-public'
    and storage.allow_any_operation(array['object.get_authenticated_info', 'object.get_authenticated'])
  );

-- 2. "Public Can Execute SECURITY DEFINER Function" (WARN) on
--    handle_new_user(): it's a trigger-only function (references NEW, only
--    valid in trigger context) and was never meant to be a callable RPC.
--    Revoking EXECUTE removes it from the public API surface; the
--    on_auth_user_created trigger still fires it regardless of role grants
--    (triggers run as the function owner, not the calling role).
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- 3. "RLS Policy Always True" (WARN) on the events insert policy: give the
--    WITH CHECK a real predicate (mirroring the column constraint already
--    on `name`) instead of a bare `true`. Effective permissiveness is
--    unchanged — this table is intentionally insert-only/open (an
--    anonymous analytics beacon has no ownership concept to check) — this
--    just documents that intent instead of pattern-matching the linter's
--    "always true" heuristic.
drop policy if exists "anyone can record an event" on public.events;
create policy "anyone can record an event"
  on public.events for insert
  to anon, authenticated
  with check (name is not null and char_length(name) between 1 and 128);

-- Reviewed, deliberately NOT changed:
--   - public.charters has RLS enabled with zero policies (INFO
--     "rls_enabled_no_policy") — intentional: "charters -> NO public read
--     of codes"; the table is only ever touched via redeem_charter()'s
--     security-definer context, which bypasses RLS as the function owner.
--   - redeem_charter(p_code text) is callable by anon/authenticated (WARN
--     "security_definer_function_executable") — intentional: it IS the
--     public redemption endpoint (POST /api/charters/redeem calls it), and
--     it validates code/window/redemption-limits internally before doing
--     anything privileged.

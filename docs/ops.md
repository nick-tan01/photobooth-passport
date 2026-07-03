# Ops runbook — Photobooth Passport

Short reference for the handful of live-incident/maintenance actions that
don't have UI yet. See CLAUDE.md for the project's hard rules and LAUNCH_PLAN.md
for the fuller architecture.

## Content takedown

A strip is public via `strips.is_public` — flip it off and its `/s/[slug]`
page 404s (`app/s/[slug]/page.tsx` queries `.eq("is_public", true)`), the
opengraph-image route stops rendering it, and anon reads are blocked. This
does **not** change the admin ledger's counts — the ledger reads the
`events` table, which is unaffected by `is_public`. Run in the Supabase SQL
editor (or via the Supabase MCP `execute_sql` tool) against the live
project:

```sql
update strips set is_public = false where share_slug = '<slug>';
```

**Storage note:** this does not delete the underlying object from the
`strips-public` bucket — the anon key has no DELETE policy (see
`supabase/migrations/0009_storage.sql`), and this route intentionally
doesn't grant one for a takedown-only action. The image stays in storage but
is unreachable through any page the app renders once `is_public` is false;
only someone with the exact `storage.objects` path (not exposed anywhere
once the strips row is hidden) and direct Storage API access could still
fetch it. Full object deletion needs a service-role action (Supabase
dashboard → Storage, or a service-role script) — not yet part of this
runbook because it hasn't been needed.

## Rate limiting POST /api/strips

`/api/strips` is public, unauthenticated, and has no server-side throttle
(see the Phase-review finding on `app/api/strips/route.ts`). At launch scale
this is a dashboard action, not code:

- Vercel dashboard → the project → **Firewall** (WAF) → add a rate-limit
  rule scoped to `POST /api/strips`, roughly **10 requests/hour/IP**. This
  is a blunt per-IP bucket (imperfect behind shared/mobile NAT — a few
  legitimate guests can share an IP) but raises the cost of a curl-loop
  abuse or storage-filling attack well above casual.
- Revisit the threshold if legitimate multi-person households/venues start
  tripping it (e.g. a physical booth at an event with many guests on one
  Wi-Fi).

## The `events` table / admin ledger are directional, not audit-grade

`public.events` has an open, unauthenticated INSERT policy by design (see
`supabase/migrations/0008_events.sql` / `0010_fix_advisories.sql`) — it's an
anonymous analytics beacon with no ownership concept to check, and
`app/api/signal/route.ts`'s sanitizer is the only gate before a row lands.
That means anyone with the public anon key (or just curl against
PostgREST directly, bypassing the route's sanitizer for anything the
table's own check constraints don't cover) can insert sanitized-but-fake
`referred_activation` / `sitting_completed` / etc. events and move the
`/admin` Bureau Ledger's numbers, including the K-factor hero.

Treat every number on `/admin` as **directional** — good for "is this
trending up or down," not for "exactly how many people did X." Don't make
a launch/rollback/spend decision off an anomalous single-day spike without
first spot-checking the raw `events` rows (source IPs, timing clustering,
repeated identical `sid`s) for signs of synthetic traffic.

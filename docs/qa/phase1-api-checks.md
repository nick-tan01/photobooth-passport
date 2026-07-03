# Phase 1 — Backend API Checks

Curl-level checks for the four Phase 1 endpoints. Run against a local
`npm run dev` (default `http://localhost:3000`) with `.env.local` populated,
then again with Supabase env vars unset to confirm graceful degradation.
These complement `scripts/verify-phase1.mjs`, which covers the RLS-sensitive
paths (anon visibility, `is_public` flip, charter-code unreadability) that
need a privileged Supabase client to fully set up/tear down.

Every response below should carry the standard security headers
(`Content-Security-Policy`, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, etc.) — omitted here for brevity.

---

## POST /api/strips

Uploads a composited strip image, creates a `strips` row, returns a public
share URL. Guest-uploadable (no auth required); 5MB cap; magic-byte sniffed
(JPEG/PNG/WEBP only, content-type header is not trusted).

**Happy path:**

```sh
curl -s -X POST http://localhost:3000/api/strips \
  -F "image=@test.jpg;type=image/jpeg" \
  -F "booth_id=standard" \
  -F "caption=hello" \
  -F "date_text=1 JAN 2026" \
  -F "serial=TEST-0001" \
  -F "finish=gloss"
```
Expected: `200` — `{"slug":"<8-char-base62>","url":"https://.../s/<slug>"}`.

**Validation edge cases:**

| Request | Expected |
|---|---|
| Missing `image` field | `400 {"error":"missing image"}` |
| Missing/invalid `booth_id` | `400 {"error":"missing or invalid booth_id"}` |
| Image > 5MB | `413 {"error":"image too large (5MB max)"}` |
| Bytes don't sniff as JPEG/PNG/WEBP | `400 {"error":"unrecognized image format"}` |
| Not `multipart/form-data` | `400 {"error":"expected multipart/form-data"}` |
| `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` unset | `503 {"error":"cloud unavailable"}` — never a 500, never throws |

---

## POST /api/charters/redeem

Validates a booking reference against the live `charters` table via the
`redeem_charter()` security-definer RPC (the table itself has no client
SELECT policy — codes are never anonymously enumerable).

```sh
curl -s -X POST http://localhost:3000/api/charters/redeem \
  -H "Content-Type: application/json" \
  -d '{"code":"VOYAGE"}'
```
Expected: `200` — `{"ok":true,"charter":{"code":"VOYAGE","name":"The Maiden Voyage Ball",...}}`.
Code matching is case/whitespace-insensitive (`voyage`, `  VOYAGE  ` both succeed).

| Request | Expected |
|---|---|
| Unknown code, e.g. `NOTREAL` | `200 {"ok":false,"reason":"not_found"}` |
| Empty `code` / missing `code` field | `400 {"ok":false,"reason":"bad_request"}` |
| Malformed JSON body | `400 {"ok":false,"reason":"bad_request"}` |
| `NEXT_PUBLIC_SUPABASE_*` unset | `503 {"ok":false,"reason":"unavailable"}` — the client (`lib/charters.ts`) then falls back to the static `CHARTERS` array (VOYAGE keeps working with zero network) |

Client-side note: `lib/charters.ts unlockCharter()` awaits the remote call
(4s `AbortController` timeout) before falling back locally — on a genuinely
offline device this resolves near-instantly (fetch fails fast with no
network interface to try), but on a degraded/high-latency connection the
"PRESENT" button in `BoothDirectory.tsx` has no pending/disabled state, so a
slow network can look unresponsive for up to ~4s. Not a correctness bug —
worth a UX pass in a later phase if charter unlock sees real usage.

---

## POST /api/signal

Fire-and-forget analytics beacon from `lib/signals.ts`. Always responds
`204` regardless of payload validity or Supabase availability — a beacon
has no meaningful error path for the caller.

```sh
curl -s -X POST http://localhost:3000/api/signal \
  -H "Content-Type: application/json" \
  -d '{"e":"sitting_started","t":1735920000000,"sid":"<anon-session-id>"}'
```
Expected: `204 No Content`. Row lands in the Supabase `events` table
(`name`, `session_id`, `strip_id`, `share_slug`, `utm`, `meta`, `created_at`)
when Supabase is configured and the insert succeeds; falls back to
`console.log("[signal]", name)` otherwise (env unset, or the insert fails).

| Request | Expected |
|---|---|
| Malformed JSON / empty body | `204` (silently ignored, nothing inserted) |
| `e` missing or not a string | `204` (silently ignored) |
| Oversized / control-char payload | `204` — body capped at 4096 chars before parsing; `e`/`sid`/`utm`/`meta` are all whitelist-sanitized (printable chars only, length-capped) before insert |
| `NEXT_PUBLIC_SUPABASE_*` unset | `204` — degrades to the console sink |

---

## GET /s/[slug]

Server-rendered public share page. `force-dynamic`; reads the `strips` row
by `share_slug` with `is_public = true` (RLS-backed — this is also the
select the anon Supabase client would get), 404s via `notFound()` on any
miss.

```sh
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/s/<real-public-slug>
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/s/doesnotexist
```
Expected: `200` for a real, public slug (body contains the booth name);
`404` (not `500`) for anything else.

| Request | Expected |
|---|---|
| Slug that doesn't exist | `404` |
| Slug of a row with `is_public = false` | `404` |
| Slug containing SQL-metacharacters / path traversal (`'; DROP TABLE strips;--`, `..%2F..%2Fetc%2Fpasswd`, `%00`) | `404` — no 500, no injection (Supabase client parameterizes the `.eq()` filter) |
| `NEXT_PUBLIC_SUPABASE_*` unset | `404` — `getSupabaseServerClient()` returns `null`, `getStrip()` short-circuits to `null`, page calls `notFound()` |

`generateMetadata` (OG/Twitter tags) follows the same `getStrip()` call, so
a missing/private slug just falls back to the plain `{ title: "Photobooth Passport" }`
metadata rather than throwing during static/dynamic rendering.

---

## Regression checklist (run after any change touching these routes)

1. `npm run build && npm run lint` — must pass with zero errors.
2. `npm run dev`, then `node scripts/verify-phase1.mjs setup` — must complete
   all three assertions (upload → anon-visible → page 200) and print the
   privileged follow-up SQL.
3. Re-run the table above with `.env.local` temporarily moved aside — every
   route must degrade (503/404/204), never 500, never throw at import time.
4. Guest capture flow smoke (cover → booth → camera → 4 exposures →
   composite → affix → passport) with the browser devtools Network tab open
   — confirm no request to any of the above routes fires synchronously on
   the capture path (only `/api/signal`, and only as a `sendBeacon`/unawaited
   `fetch`).

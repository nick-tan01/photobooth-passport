# Phase 4 — UTM Attribution + /admin Bureau Ledger: Manual On-Device Test Script

Automatable parts of Phase 4 (UTM param whitelisting, `pp_ref` persistence,
`referred_activation` beacon payload, the `/admin` key-gate copy, CSP header
byte-level checks, build/lint) are covered by the QA-verifier's browser pass
against `npm run build && npm start` — see the Phase 4 gate report. This
document is only for the steps that genuinely need a **real phone**: camera
permission on the referred first-run path, PWA/installed-mode behavior, and
confirming the office-key lockout copy reads correctly on a small screen.
Run on real hardware, not a simulator.

- **Device A: iPhone, Safari** (primary target)
- **Device B: Android phone, Chrome**

Replace `<PRODUCTION_URL>` with the live Vercel URL / custom domain.
Replace `<SLUG>` with a real, currently-public strip slug (e.g. one made in
Part 1 below, or `node scripts/verify-phase1.mjs setup` on a dev machine).

---

## Part 1 — Real-phone UTM link → activation

This exercises the exact chain the Phase 4 gate proved in a desktop browser
(CTA deep-link → `pp_ref` persistence → `referred_activation` beacon →
`events.utm`), but on real mobile Safari/Chrome where localStorage,
sendBeacon, and the camera all behave slightly differently than desktop.

| # | Step | Expected result |
|---|------|------------------|
| 1 | On Device A, in a **fresh private/incognito tab** (not a tab with prior app history), open `<PRODUCTION_URL>/s/<SLUG>?utm_source=instagram&utm_campaign=phone-qa` | Share page loads: strip image, booth name, one "Make your own at {booth} →" button. No visible sign the UTM params were even read (they're invisible plumbing). |
| 2 | Tap **Make your own at {booth} →** | Lands directly on that booth's sitting card. Top row reads "ADMITTED ON THE RECOMMENDATION OF A FELLOW TRAVELLER" in gold. Address bar now shows `/?booth=...&ref=<SLUG>&utm_source=instagram&utm_campaign=phone-qa`. |
| 3 | Tap **Begin the sitting** | Camera permission prompt appears (first time only) — identical UX to a non-referred sitting, no extra gate. |
| 4 | Grant camera access and complete all 4 exposures for real (this is the one step the desktop test script can't cover — a real camera, not the test-pattern fallback) | Strip composites normally. |
| 5 | On the Finishing screen, pick any finish and tap **Affix & Stamp** | Lands on "Record filed." with the ADMITTED stamp. This is the moment `referred_activation` fires (once, silently, in the background — nothing visible changes on screen to indicate it). |
| 6 | Background the app or lock the phone for a few seconds, then reopen and confirm the Admitted screen is still showing (not stuck mid-transition) | Confirms the beacon fire didn't block/hang the affix UI on a real device's network stack. |
| 7 | From the same tab/session, go to **THE BOOTHS**, pick any booth, and complete a **second** full sitting (real camera again) through Affix & Stamp | Second strip files normally (e.g. serial `...-0002`). No visible difference in behavior — this is the "second affix doesn't double-fire `referred_activation`" check, which has no on-screen indicator either way; just confirm no error, no hang, no duplicate-looking UI state. |
| 8 | Report the slug from step 1, the two strip serials from steps 5 and 7, and (if visible in a debugging proxy / your own instrumentation) the device's `pp_sid` | Handed to whoever has privileged Supabase access to spot-check `events.utm` has exactly one `referred_activation` row for this session, carrying `{"utm_source":"instagram","utm_campaign":"phone-qa"}`. |

## Part 2 — /admin on a phone

| # | Step | Expected result |
|---|------|------------------|
| 9 | On Device A, navigate to `<PRODUCTION_URL>/admin` (typed directly — confirm there is genuinely no link to it anywhere in the app's own UI first, by browsing normally and checking you can't stumble into it) | "PRESENT CREDENTIALS" gate renders full-screen, single bordered panel, no layout overflow/horizontal scroll on a small screen. The `OFFICE KEY` input and `PRESENT` button are both comfortably tappable (not cramped/overlapping) at phone width. |
| 10 | Tap the OFFICE KEY field | The device's password-manager/autofill UI may offer to save — decline it (this field intentionally holds a shared office secret, not a personal password, and autofill/keychain storage on a personal device is out of scope for this internal tool). Type a **wrong** key and tap PRESENT. |
| 11 | — | Rejection line "CREDENTIALS NOT RECOGNIZED — CHECK THE KEY." appears in signal-red, legible at phone width, doesn't overflow the panel. |
| 12 | Enter the correct office key (get it from whoever holds it — never from a URL, chat log, or screenshot) and tap PRESENT | Bureau Ledger renders: K-factor hero (navy plate, large numeral) followed by the three ledger tables, all readable without horizontal scrolling on a phone screen. Table numerals stay right-aligned and don't wrap awkwardly. |
| 13 | Close the browser tab entirely (not just background it), reopen Safari/Chrome, and navigate to `/admin` again | Ledger renders again **without** re-prompting for the key — confirms the httpOnly session cookie survived a real app/tab restart on this device (12h lifetime). |
| 14 | In Settings, clear this site's cookies/data for the production domain (or wait out the 12h window), then reload `/admin` | Falls back to the PRESENT CREDENTIALS gate again — confirms the cookie actually expires/clears rather than being silently re-derived from somewhere else. |

## Part 3 — Wrong-key lockout behavior, adversarial pass

| # | Step | Expected result |
|---|------|------------------|
| 15 | On Device B, attempt the OFFICE KEY field with: an empty submission, a key with trailing whitespace, and a key that's a truncated prefix of the real one | All three are rejected with the same "CREDENTIALS NOT RECOGNIZED — CHECK THE KEY." copy — no distinct error for "close but wrong" vs. "nowhere close" (no oracle). |
| 16 | Attempt several wrong keys in a row, quickly | No visible lockout/backoff/CAPTCHA appears (none is currently specced) — just confirm the page doesn't error, crash, or leak a stack trace on repeated failed attempts. |
| 17 | View page source (or "Share > Copy Link") after a failed attempt | The URL is `/admin?error=invalid` — confirm the key typed in step 15/16 is **not** present anywhere in the URL, address bar history entry, or page source. |

---

## What NOT to see, anywhere above

- The office key appearing in a URL, browser history entry, page source, or any cookie visible to `document.cookie` / a cookie-inspection extension.
- A signup/login wall anywhere in Part 1 (referred visitors get the same guest-first camera flow as anyone else).
- `/admin` reachable via any tap-through from the normal app UI (cover, directory, booth, passport, share page) — it must only ever be reached by typing the URL directly.
- Any distinguishable difference in the rejection copy between "wrong key" and "no key configured" (both must read as ordinary "CREDENTIALS NOT RECOGNIZED").
- A blank/broken Ledger render on first correct-key entry when the tables are genuinely empty (fresh environment) — confirm separately in a low-traffic moment that the empty-state lines read "NO CROSSINGS RECORDED — THE REGISTER IS EMPTY.", "NO REFERRALS ON FILE.", and "NO ORIGIN STAMPED." rather than a blank table or a JS error.

## Reporting

Record Pass/Fail per step with device + OS/browser version. For any Fail,
include a screenshot, the exact URL/slug involved, and the strip serial or
`pp_sid` if relevant. Never include the office key itself in a bug report —
reference "the office key" and let whoever reproduces it look it up
separately.

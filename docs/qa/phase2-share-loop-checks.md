# Phase 2 — Share Loop: Manual On-Device Test Script

Automatable parts of the share loop (build/lint, `/s/[slug]` meta tags, OG
image bytes, QR decode, upload-on-share-intent dedupe, referred first-run
copy, signal beacons) are covered by the QA-verifier's browser pass against
`npm run build && npm start` — see the Phase 2 gate report. This document is
only for the steps that genuinely need a **real phone**: camera permission,
the native share sheet, an iMessage/SMS link preview, and scanning a printed
or on-screen QR code with an actual camera. Run on real hardware, not a
simulator.

- **Device A: iPhone, Safari** (primary target)
- **Device B: Android phone, Chrome**

Replace `<PRODUCTION_URL>` with the live Vercel URL / custom domain.

---

## Part 1 — Creator side: share a strip for real

| # | Step | Expected result |
|---|------|------------------|
| 1 | On Device A, complete a normal sitting (cover → directory → booth → 4 exposures → customize, add a caption → Affix & Stamp) | Lands on Admitted ("Record filed.") with no signup prompt anywhere in the path. |
| 2 | Tap **Share the strip** | Native iOS share sheet opens with the strip image attached. If Web Share with files isn't supported, no share sheet is shown at all — flag this as a Fail and note the iOS/Safari version (spec requires Share to always be the primary action). |
| 3 | In the share sheet, choose **Messages** and send to yourself/a second device | Message sends. Open the message: **before** the recipient taps anything, check the message bubble shows a link preview (image thumbnail + title), not a bare URL. This is the real-world iMessage unfurl the OG-image work exists for. |
| 4 | Zoom into the link preview thumbnail | The thumbnail is the strip image on a cream background, not stretched/cropped into a square, not the app icon, not a broken-image placeholder. |
| 5 | Back on Device A's Admitted screen, tap **COPY LINK** | A brief gold confirmation line appears ("LINK COPIED — PASTE IT ANYWHERE."). Paste into Notes/Messages to confirm the clipboard actually has the `/s/[slug]` URL. |
| 6 | Repeat step 2 (Share the strip) a second time for the *same* strip | Share sheet still opens promptly (no multi-second hang) — confirms the cached slug is reused, not re-uploaded. |
| 7 | Tap **STORY CARD 9:16**, save/share the resulting image | 9:16 image saves/shares without error. Open it full-screen: navy card, strip large and centered, QR block visible in the lower third, not touching the very bottom edge of the frame. |
| 8 | Repeat steps 1–7 on Device B (Android Chrome) | Same behavior. Note any Android-specific share-sheet differences (e.g. app chooser layout) but the underlying share must still succeed. |

## Part 2 — QR scan, camera-to-camera

| # | Step | Expected result |
|---|------|------------------|
| 9 | Display the story card from step 7 full-screen on Device A | — |
| 10 | On Device B, open the native Camera app (not a QR scanner app) and point it at Device A's screen | iOS/Android's built-in camera QR detection surfaces a notification/banner with the recognized link within ~2 seconds, at a normal arm's-length distance. |
| 11 | Tap the QR notification | Device B's browser opens the `/s/[slug]` URL, with `?utm_source=qr` in the address bar. |
| 12 | If a printer is available: print the story card (or a screenshot of it) at roughly 4×6" photo size and repeat steps 10–11 scanning the physical print | QR still scans reliably at that size/distance — confirms the module size/contrast survives print, not just on-screen rendering. |

## Part 3 — Referred visitor: the other half of the loop

| # | Step | Expected result |
|---|------|------------------|
| 13 | On Device B, tap the `/s/[slug]` link from the Messages preview (step 3) — do **not** open it from history/autocomplete, use the actual tap-through from the message | `/s/[slug]` page loads: eyebrow, "ADMITTED — {BOOTH}" heading, the strip large and centered in a dashed panel, one dominant "Make your own at {booth} →" button. No login/signup anywhere. |
| 14 | Tap **Make your own at {booth} →** | Lands directly on that booth's sitting card (SessionIntro) — Cover and Directory are both skipped. The top row reads "ADMITTED ON THE RECOMMENDATION OF A FELLOW TRAVELLER" in gold, not "← DIRECTORY". |
| 15 | Tap **Begin the sitting** | Browser shows the **camera permission prompt** (first time only) exactly as in the normal flow — referred visitors get the same camera UX as anyone else, no extra gate. |
| 16 | Complete the sitting and affix | Reaches Admitted normally. This is the referred visitor's own first strip. |
| 17 | Background the app / lock the phone for 10+ seconds, then reopen and repeat a second full sitting under the same referred link (still same browser/session) | Second sitting also completes and affixes normally — this exercises the "second affix must not double-count" rule from the device side, but there's no on-screen indicator either way (it's server-side attribution) — just confirm the app doesn't error or behave differently on the second affix. |

## Part 4 — PWA / installed-mode share loop

| # | Step | Expected result |
|---|------|------------------|
| 18 | Install the app to the home screen on Device A (per `phase0-device-smoke-test.md` Part 2) | Installs normally. |
| 19 | From the installed (standalone) app, complete a sitting and tap **Share the strip** | The native share sheet still opens correctly from standalone/PWA mode (this can behave differently than in-browser on some iOS versions) — confirm no silent failure or console error. |
| 20 | From a **different** device's browser (not installed), open the shared `/s/[slug]` link and tap the CTA | Opens the marketing/share page and referred flow correctly in a plain browser tab — the loop must work for a stranger who has never installed anything. |

---

## What NOT to see, anywhere above

- A signup/login screen or "create an account to continue" wall at any point in Parts 1–4.
- A generic/broken share-sheet icon instead of the strip thumbnail.
- The QR resolving to a different booth/strip than the one displayed.
- Any step silently failing with no feedback (share sheet not opening, COPY LINK doing nothing) AND no fallback — some visible outcome (share sheet, copy confirmation, or a plain download) must always occur.

## Reporting

Record Pass/Fail per step with device + OS/browser version. For any Fail,
include a screenshot, the exact URL/slug involved, and (if reproducible)
whether it also fails in the desktop browser pass documented in the Phase 2
gate report — that distinguishes a device-specific bug from a shared one.

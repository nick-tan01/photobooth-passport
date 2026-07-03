# Phase 0 — Manual On-Device Smoke Test

Run this on two real devices before/after each production deploy:

- **Device A: iPhone, Safari** (the primary target — check Dynamic Island / notch safe areas)
- **Device B: Android phone, Chrome**

Do not use a simulator for the "Add to Home Screen" / standalone-launch steps — icon
rendering, safe-area insets, and install prompts differ from real hardware.

Replace `<PRODUCTION_URL>` below with the live Vercel URL (or the custom domain once attached).

---

## Part 1 — Browser tab (before installing)

| # | Step | Expected result |
|---|------|------------------|
| 1 | Open `<PRODUCTION_URL>` in Safari (iPhone) | Page loads over HTTPS, no browser security warning. Cover screen renders (title, no layout shift/flash of unstyled content). |
| 2 | Repeat on Android Chrome | Same cover screen renders correctly. |
| 3 | On iPhone: check the status bar area | Page content does not render underneath/behind the status bar or Dynamic Island — there is a visible navy band matching the safe-area inset at the top. |
| 4 | Tap through: Cover → booth directory | Directory screen with booth list/map option appears. No login/signup screen appears anywhere in this path. |
| 5 | Select a booth → session intro screen | Booth name, serial number, date shown. "Begin sitting" control visible. |
| 6 | Tap "Begin sitting" | Browser shows a **camera permission prompt**. |
| 7 | Grant camera permission | Live front camera preview appears in the booth frame. |
| 8 | Complete the sitting: take exposure 1 of 4 | Counter reads "EXPOSURE 2 OF 4" after capture; a brief pause/flash animation plays between shots. |
| 9 | Take exposures 2, 3, 4 | Counter advances correctly each time; after the 4th capture, the app automatically moves to the strip-reveal screen. |
| 10 | Strip reveal screen | A single composited strip image with all 4 exposures is visible (not blank, not a broken image icon). |
| 11 | Proceed to customize screen | Caption/date fields editable; finish options visible (Gloss / Silver / Pearl / Gold). |
| 12 | Tap through each finish option | Strip preview visually updates for each finish choice without error or blank flash. |
| 13 | Choose a finish, tap "Affix" | App transitions to the "Admitted" / stamped screen — no network spinner, no error toast, works even if step 14 (airplane mode) is tested here. |
| 14 | Open the Passport view | The just-affixed strip appears in the passport/collection view. |
| 15 | Repeat steps 4–14 on Android Chrome | Same behavior — no auth prompt at any point, camera permission requested only once per session, strip composites and affixes correctly. |

## Part 2 — Install as PWA

| # | Step | Expected result |
|---|------|------------------|
| 16 | iPhone Safari: Share sheet → "Add to Home Screen" | Preview shows correct app icon (not a generic globe/broken-image icon) and the name "Photobooth". |
| 17 | Confirm add | New icon appears on the iPhone home screen with correct artwork, no white/blank square. |
| 18 | Android Chrome: menu → "Add to Home screen" / "Install app" | Same — install prompt shows correct icon and app name, confirm install. |
| 19 | Tap the new home-screen icon (iPhone) | App launches **standalone** — no Safari address bar or browser chrome visible. |
| 20 | Check safe areas in standalone mode (iPhone) | Content still clears the Dynamic Island / notch at the top and the home-indicator area at the bottom; no controls are clipped or hidden behind either. |
| 21 | Tap the new home-screen icon (Android) | App launches standalone (no Chrome address bar/tab UI). |
| 22 | In standalone mode, repeat a full sitting (steps 6–14 above) on both devices | Full flow works identically to the browser-tab version — camera, 4 exposures, composite, finish, affix, passport. |

## Part 3 — Offline / airplane mode

| # | Step | Expected result |
|---|------|------------------|
| 23 | With the app already opened once (installed, standalone) on iPhone, enable Airplane Mode | — |
| 24 | Fully close the app (swipe up / force-quit) and relaunch from the home-screen icon | App shell still loads (cover screen or last-viewed screen renders) instead of a browser "no internet" / dinosaur error page. |
| 25 | Navigate within the app while offline (directory, passport view) | Navigation between already-visited screens works without a network error, since this app is IndexedDB/localStorage-only and does not require a live connection for the core flow. |
| 26 | Attempt a fresh sitting while offline | Camera still works (camera access is local, not network-dependent) and a strip can be composited and affixed — confirms the guest flow has no hidden network/auth dependency. |
| 27 | Disable Airplane Mode, revisit the app | App still works normally; no stale-shell artifacts (e.g., an old cached version of the UI) — confirms the service worker's network-first navigation strategy picked up the latest deploy. |
| 28 | Repeat steps 23–27 on Android Chrome (installed PWA) | Same expected results as iPhone. |

---

## Reporting

For each numbered step, record **Pass / Fail** plus the device + OS/browser version tested.
Any Fail should include a screenshot and, if possible, the browser console output
(Safari: connect via Mac Web Inspector; Chrome: `chrome://inspect` from desktop Chrome).

---
# Photobooth Passport — Design System
# Extracted from the live codebase (app/globals.css, tailwind.config.ts,
# components/*, lib/stamp.ts, lib/composite.ts, lib/sharecard.ts) on 2026-07-03.
# This is a DESCRIPTION of what exists, not a wishlist. If code and this file
# ever disagree, the code is right until this file is updated to match it.

design_system:
  name: "Photobooth Passport — The Grand Tour Company"
  version: "1.0 (extracted, pre-Phase-2)"

  color:
    # Tailwind token -> hex, as declared in tailwind.config.ts
    cream:       "#F2ECDD"   # primary screen background (bg-cream)
    cream-deep:  "#E6DCC4"   # recessed panels, the passport "page" well
    paper:       "#F9F4E9"   # lightest surface — button text, plates, seals
    navy:        "#1F3A5F"   # primary ink / brand color — cover, headers, primary buttons
    navy-deep:   "#14243A"   # button border/shadow depth, plate bevel
    ink:         "#22262B"   # body text, rules, borders
    ink-soft:    "#4A4F57"   # secondary text
    faded:       "#8A7F6A"   # tertiary/meta text, placeholders, dashed borders
    gold:        "#C9A86A"   # accent — borders, stamps, "official" marks, active states
    signal:      "#B33A3A"   # alerts, VOID, destructive actions, "on location only" tags
    booth:       "#10151D"   # the physical booth/machine chrome (slot, plate)
    # Raw hex used directly in canvas/SVG code (not Tailwind tokens, but load-bearing):
    body-bg:     "#0E1420"   # <body> background outside the app's max-w frame (letterboxing)
    photo-corner: "#DFD3B4"  # mounting-corner triangles on strip photos
    entry-stamp-default: "#A33B2E"  # EntryStamp fallback ink (brick/oxblood, distinct from `signal`)
    # Per-booth accent colors (lib/booths.ts) — each booth/charter carries its own
    # stamp/accent hue against the shared cream/navy/gold system, e.g.:
    #   standard #1F3A5F (navy)   midnight #44406E   seaside #2F6B5E
    #   montreal #5A3F6E           niagara  #37596E   midsummer #6B7C3F   firstsnow #3E5E78
    # Each booth also carries its own near-white "paper" tint (e.g. #F9F4E9,
    # #F5F0E4, #F8F4E6…) used as the strip's paper stock in composite.ts.

  typography:
    display:
      family: '"Playfair Display", Georgia, serif'
      source: "Google Fonts, weights 500/600/700 roman + 500/600 italic"
      role: "Headlines, wordmarks, stamp lettering, captions — the 'engraved/travel-document' voice"
      usage_examples:
        - "PHOTOBOOTH / PASSPORT cover title: 30px, bold, tracking 0.16em, uppercase"
        - "Screen H1s (Passport, Admitted 'Record filed.'): 26–27px, bold"
        - "Booth name in directory rows: 19px, semibold"
        - "Caption on strip / share card: italic 600, 30px on strip, 44px on 9:16 card"
        - "PlateButton label: font-display, bold, uppercase, tracking 0.18em, 15px"
    geo:
      family: 'Jost, "Avenir Next", Futura, sans-serif'
      source: "Google Fonts, weights 400/500/600"
      role: "Everything geometric/typewritten: labels, meta text, form fields, ticket copy — default body font (applied to <body>)"
      usage_examples:
        - "Eyebrow labels (TRAVEL DOCUMENT · TYPE P, HOLDER ·, DATED): 9-12px, tracking 0.24-0.32em, uppercase"
        - "TypeLink secondary actions: 13px, tracking wider, underlined"
        - "Stamp arc text (booth name/locale): 8.5-10.5px depending on length"
    scale_notes:
      - "Sizes are hand-picked pixel values (not a fixed type scale) — mostly 8.5px to 30px, chosen per component."
      - "Tracking (letter-spacing) is a primary voice tool: labels/meta run 0.12em-0.32em; headlines run 0.16em; body copy is untracked."
      - "Uppercase is used for all institutional/label copy; sentence case + italics is reserved for warm/human copy (taglines, captions)."

  spacing_and_layout:
    app_max_width: "430px (maxWidth.app in tailwind.config.ts) — the whole app is phone-width even on desktop, letterboxed on --body-bg #0E1420"
    screen_padding: "px-5 (20px) horizontal is the standard screen gutter; px-8 on the Cover"
    safe_area:
      pt-safe: "env(safe-area-inset-top) + 1.75rem"
      pt-safe-lg: "env(safe-area-inset-top) + 2.25rem"
      pt-safe-xl: "env(safe-area-inset-top) + 3.5rem"
      pb-safe: "env(safe-area-inset-bottom) + 2rem"
      pb-safe-xl: "env(safe-area-inset-bottom) + 3rem"
      note: "Every full-screen surface pads for iOS Dynamic Island / home indicator via these utility classes; never hardcode top/bottom padding on a screen root."
    radii: "Effectively zero. No rounded-* on structural elements (buttons, panels, cards are square-cornered), EXCEPT true circles (stamps, dots, the finish-swatch circles) and small pill/rounded-full badges. Squareness is a deliberate 'printed document' signal — do not introduce soft app-style rounded-2xl cards."
    borders: "1-2px solid borders in ink/navy/gold do most of the structural work (no shadows-as-cards). Dashed borders (border-dashed) mark 'not yet' / placeholder / locked states. Double borders (two nested insets) mark ceremonial/official framing (Cover, share card)."

  shadows:
    strip: "0 1px 2px rgba(20,36,58,0.16), 0 8px 22px rgba(20,36,58,0.22)"
      # tailwind `shadow-strip` — applied to every rendered photo strip <img>. A tight
      # contact shadow + a soft navy-tinted drop shadow, i.e. "paper resting on a surface."
    plate: "inset 0 -3px 0 rgba(0,0,0,0.25), 0 1px 2px rgba(20,36,58,0.3)"
      # tailwind `shadow-plate` — applied to PlateButton and the booth "slot" chrome.
      # Inset bottom shadow reads as a bevelled machine plate, not a flat web button.

  texture_and_grain:
    paper_texture_overlay:
      component: "components/PaperTexture.tsx"
      technique: "Full-screen absolute div, z-40, pointer-events-none, mix-blend-multiply, background-image = inline data-URI SVG with feTurbulence (fractalNoise, baseFrequency 0.8, 2 octaves) run through feColorMatrix to a near-black low-alpha (0.035) tint, tiled 160x160."
      vignette: "Optional (default on) — radial-gradient(120% 100% at 50% 45%, transparent 65% -> rgba(20,36,58,0.10) 100%), stacked above the noise."
      usage: "Mounted once at the bottom of every full-screen surface (Cover, Passport, Admitted, StripReveal, CustomizeStrip, BoothDirectory) as the final child, so grain sits over all content uniformly."
    canvas_paper_noise:
      location: "lib/composite.ts paperNoise()"
      technique: "Seeded per-strip (mulberry32 PRNG keyed off the strip serial, so re-composing with a new caption doesn't reshuffle the grain): builds a 128x128 tile of random near-white pixels (v = 226 + rand*29), draws it with globalCompositeOperation 'multiply' at alpha 0.4, tiled across the strip canvas. This is the film-grain/paper-tooth baked into the actual exported strip image, distinct from the CSS overlay used on-screen."
    stamp_ink_bleed:
      location: "lib/stamp.ts buildBoothStampSvg / drawBoothStamp"
      technique: "SVG feTurbulence + feDisplacementMap (baseFrequency ~0.5-0.55, scale 1.6-1.8) warps every stamp's stroke paths — a 'hand-inked rubber stamp' wobble, never perfectly geometric. The canvas version additionally does a two-pass render: a solid impression + a second pass offset (0.7,0.5)px at ~22% alpha, simulating a double-struck/ghosted ink impression."
    perforation:
      class: ".perf-y in globals.css"
      technique: "radial-gradient circle-punch pattern (2.1px dot, 2.5px falloff, 13px vertical repeat) using a CSS var --perf (defaults to cream #F2ECDD) so the page color shows through — a ticket-stub tear line."

  motion:
    principle: "Every transition reads as a PHYSICAL, mechanical event (a stamp slamming down, a strip motor-feeding out of a slot, a page turning) — never a generic fade/slide. Timing curves favor overshoot/settle (cubic-bezier springs) over ease-in-out."
    keyframes:
      screen-in: "280ms ease-out, opacity 0->1 + translateY(10px)->0 — default screen mount transition"
      thunk-in: "300ms cubic-bezier(0.2,1.4,0.3,1) — scale 2.3->0.95->1.04->1 with a rotation held via --thunk-rot custom property; used for countdown numerals and the ADMITTED stamp slamming into place"
      flash-out: "420ms ease-out, opacity 0.95->0 — camera flash overlay on capture"
      print-down: "3.4s cubic-bezier(0.3,0.4,0.4,1) — a hand-tuned multi-keyframe translateY sequence with small back-steps (motor judder) simulating a photo strip feeding down out of a booth slot"
      soft-blink: "1.6s ease-in-out infinite, opacity 1<->0.35 — 'waiting/processing' text (OPENING THE REGISTER…, DEVELOPING…)"
      slip-drop: "260ms ease-out, translateY(-8px)->0 with --slip-rot rotation — a paper slip dropping in (pose prompts)"
      rise-in: "360ms ease-out, opacity 0->1 + translateY(6px)->0 — generic action-row entrance, gentler than screen-in"
      page-turn: "320ms ease-out, perspective(900px) rotateY(-14deg) translateX(12px) -> none, transform-origin left center — the Passport's photo page arriving as a turned leaf"
    press_state:
      class: ".press"
      technique: "transition transform/box-shadow 90ms ease; :active -> translateY(1.5px). Applied to every tappable plate/button so taps feel like a physical button depression, not a hover-style highlight."

  components:
    PlateButton:
      role: "The one primary action per screen — 'an engraved machine plate.'"
      spec: "block w-full, bg-navy, text-paper, font-display bold uppercase, tracking 0.18em, 15px, py-4 px-6, border border-navy-deep, shadow-plate, .press, disabled:opacity-40"
    TypeLink:
      role: "Secondary actions — typed, underlined, quiet."
      spec: "font-geo 13px, tracking-wider, underline underline-offset-4 decoration-[1.5px] decoration-faded, text-ink-soft, disabled:no-underline disabled:opacity-45"
    FormCheck:
      role: "Typed form checkbox — square box, red-ink X stroke when checked (hand-marked ballot/customs-form feel)."
      spec: "22x22px border-[1.5px] border-ink bg-paper box; checked mark is an SVG X path stroked #1F3A5F at width 2.6"
    typed_field (.typed-field in globals.css):
      role: "Underlined form input styled like a typewritten line, not a boxed input."
      spec: "17px, transparent bg, no border except border-bottom 1.5px rgba(34,38,43,0.45); focus -> border-bottom-color #C9A86A (gold); placeholder color rgba(138,126,104,0.75) tracked 0.04em"
    stamps:
      SealStamp / BoothStamp (lib/stamp.ts buildBoothStampSvg):
        spec: "120x120 viewBox circular seal: outer ring r=55 (stroke-width 3), inner ring r=37 (stroke-width 1.3), a per-booth glyph (camera/moon/waves/falls/fleur/bunting/snow — hand-drawn stroke paths, not icon-font glyphs) centered, curved top/bottom text on textPath arcs in Playfair Display, two small solid dots at the ring's left/right poles. Rendered in the booth's accent color, feTurbulence-displaced for ink texture."
      EntryStamp (buildEntryStampSvg):
        spec: "230x96 viewBox rectangular stamp ('ADMITTED'): double-rule rectangle border (outer stroke-width 3, inner 1.3), bold tracked (6em) word + a '· DATE ·' subline, both Playfair Display, same ink-bleed displacement filter. Default color #A33B2E; overridden per-booth."
      canvas parity: "lib/stamp.ts drawBoothStamp() re-implements the same seal for canvas contexts (strip compositing, share card) with a two-pass ink-bleed technique (see texture_and_grain.stamp_ink_bleed) so exported images match the on-screen SVG look."
    photo_corners (components/CustomizeStrip.tsx PhotoCorners):
      spec: "Four 28x28px (h-7 w-7) triangles, color #DFD3B4, clip-path'd to corner triangles, absolutely positioned ~6px outside each corner of a photo/strip — the physical photo-album mounting-corner motif, used on every rendered strip across Passport, Admitted, StripReveal, CustomizeStrip."
    PaperTexture: "See texture_and_grain.paper_texture_overlay above."

  imagery_and_composited_assets:
    strip_composite (lib/composite.ts, 720px wide canvas):
      layout: "Header (booth wordmark 'PHOTOBOOTH PASSPORT' tracked, booth display name, double gold+navy rule) -> 4 photos stacked vertically, each independently jittered in rotation/offset (seeded by serial, so re-renders are stable) with a radial vignette and a dark 2px contact-stroke border -> footer (italic caption OR a plain rule if no caption, DATED line, serial + 'FOUR EXPOSURES', 'ISSUED BY THE GRAND TOUR COMPANY · ONE AMENDMENT PERMITTED' micro-copy, booth seal stamp bottom-right)."
      paper_stock: "Each booth defines its own near-white `paper` hex (e.g. seaside #F8F4E6, midnight #F5F0E4) used as the strip canvas background — strips from different booths are subtly different paper stock, not identical white."
    print_finishes (lib/filters.ts):
      names: "GLOSS (as-shot, honest print), SILVER (dip-and-dunk B&W, deep blacks), PEARL (bright soft B&W), GOLD (warm 1970s colour)"
      note: "Named and grounded in real photobooth-history references (Auto-Photo Model 11 silver-halide, Korean 'Photogray'-style booths, 1970s C-model color booths) — finish copy should always read as a photo-lab option, not a generic Instagram filter name."

---

## Voice and world

Photobooth Passport is branded as **THE GRAND TOUR COMPANY** — a fictional, faintly bureaucratic travel-document outfit that happens to run photobooths. Every screen speaks in that voice: a mix of **customs-form officialese** and **vintage-travel warmth**. (The build plan's working shorthand for this world is "Bureau of Memories" — that phrase does not appear as literal in-app copy today; the literal, repeated in-app mark is **"THE GRAND TOUR COMPANY."** Treat "Bureau of Memories" as the narrative *frame* for the brand, and "THE GRAND TOUR COMPANY" as the actual wordmark/byline to reuse verbatim on new surfaces.)

**Microcopy rules, extracted from actual strings in the app:**

- **Institutional labels are ALL CAPS, letter-spaced, and short**: `TRAVEL DOCUMENT · TYPE P`, `RECORDS OF MEMORY`, `DEPARTURES · FOUR EXPOSURES PER SITTING`, `ISSUED BY THE GRAND TOUR COMPANY · EST. 2026`. These read like stamped plate text on a real document.
- **Human/warm copy is sentence case and often italic serif**: "Four exposures. One strip. Stamped for keeps.", "Record filed.", "Write something small" (placeholder). This is the one register where the brand sounds like a person, not a form.
- **Everything is a "record," "sitting," "exposure," or "amendment," never a "photo," "session," or "retake."** E.g. "AMENDMENT USED — NO FURTHER RE-SITTINGS", "An amendment voids these exposures. The company permits ONE (1) per record.", "VOID THIS RECORD?"
- **Serial numbers ("No. {serial}") and dates ("DATED {date}") are always present** near any artifact (strip, stamp, share card) — the app insists on treating every photo as a numbered, dated official record, not an ephemeral snap.
- **Booths are "ports of call," charters are bookings with a "booking reference" you "present"** ("NOT ON THE MANIFEST — CHECK THE REFERENCE."), seasonal booths are "on the season" and closed booths say "RETURNS IN {MONTH}" rather than "coming soon."
- **CTAs are terse verbs in the same officious register**: "Affix to passport →", "Affix & stamp", "Present", "Visit a booth" — never "Continue," "Next," or "Submit."
- **The stamp/seal convention**: every booth has a circular seal (top = booth name, bottom = its locale, e.g. "PIER PAVILION" / "HEAD OFFICE") and every completed sitting gets a rectangular "ADMITTED" ink stamp with its date. New surfaces that mark completion/possession of something should reach for one of these two stamp shapes rather than inventing a badge/checkmark style.
- **Ticket/travel-document furniture**: perforated edges (`.perf-y`), double-ruled borders, dashed "not yet collected" placeholders, and photo corners are the recurring physical metaphors. New chrome should draw from this set before inventing new UI chrome (no card shadows, no rounded pill buttons, no generic modal sheets).

## Share-card composer (`lib/sharecard.ts`)

This already-built 1080×1920 (9:16) canvas composer is the existing precedent for any story/share surface and should be treated as the reference implementation, not reinvented:

- **Background**: solid navy `#1F3A5F` fill (not cream) — the story card uses the Cover's "passport binding" palette rather than the interior "paper" palette, because it's meant to look like the passport itself, not a page inside it.
- **Framing**: a double gold border — outer stroke `#C9A86A` at 70% alpha (`B3` hex alpha), 5px, inset 42px from the edge; inner stroke `#C9A86A` at 35% alpha (`59` hex alpha), 2px, inset 64px. This nested-border "ceremonial frame" is the same device used on the Cover screen (border-gold/65 + border-gold/35 insets) — reuse it for any new full-bleed branded surface.
- **Header lockup**: `PHOTOBOOTH PASSPORT` in Jost 600 40px, gold, tracked 14px, centered; `THE GRAND TOUR COMPANY` beneath in Jost 500 22px, gold at 80% alpha, tracked 8px. This exact two-line lockup is the brand's canonical header and should be reused verbatim (same fonts/weights/tracking) on new branded surfaces rather than restyled.
- **The strip artifact**: the photo strip image is placed large and centered, rotated a barely-perceptible -0.022 rad, with a soft drop shadow (black 50%, blur 48, offsetY 18) and the same 4-corner photo-mounting-corner motif (`#DFD3B4`) used everywhere else in the app — consistency of the corner motif across on-screen React and canvas-rendered assets is a hard rule already in place.
- **Caption block**: booth name in italic Playfair Display 600 44px, cream `#F2ECDD`; below it, `No. {serial} · DATED {date}` in Jost 500 26px gold at 90% alpha, tracked 4px — then the booth's circular seal stamp, gold, bottom-right.
- **Fonts**: pulled through `ensureFonts()` / `DISPLAY` and `GEO` constants shared with `lib/stamp.ts` and `lib/composite.ts` — any new canvas-rendered surface must call the same font-loading helper before drawing text, or risk a fallback-font flash/mismatch.

This composer is the strongest existing precedent for what a **public, single-artifact branded surface** (as opposed to an interactive in-app screen) should look like: navy ground, double gold ceremonial border, the two-line GRAND TOUR COMPANY lockup, cream/gold text, and the stamp as the trust mark. Any new public-facing image or page (share page hero, OG image) should start from this palette and framing before inventing something new.

## What NOT to introduce

To keep new surfaces from drifting into generic AI-app look (per CLAUDE.md's "preserve the existing aesthetic" rule):

- No rounded-2xl/rounded-xl cards, no soft drop-shadow "elevated card" UI — this app uses flat paper + hard rules + the two named shadows (`shadow-strip`, `shadow-plate`) only.
- No blue/purple gradient buttons, no pill-shaped CTAs — buttons are square PlateButtons (navy fill) or underlined TypeLinks, nothing else.
- No generic sans-serif (Inter, system-ui, etc.) for headlines — Playfair Display is the only display face in the system; Jost is the only body/label face.
- No confetti/emoji/generic "success" iconography — completion states use the stamp (ADMITTED) motif, never a checkmark-in-a-circle.
- No skeleton-loader shimmer — loading/waiting states use the `.soft-blink` tracked-caps text pattern ("OPENING THE REGISTER…", "DEVELOPING…").

---

## New-surface specs

### `/s/[slug]` public share page — Phase 2 spec

This is the highest-leverage new surface in the launch plan: the public, server-rendered landing page a shared strip/story-card link points to, with Open Graph tags and a dominant "Make your own" CTA. Items 1–2 below are the structural decisions locked in Phase 1 (Supabase schema + share-URL issuance) and remain the **canonical record** for `share_slug`/OG behavior — unchanged. Item 3 replaces the old Phase-1 "skeleton" placeholder with the full Phase 2 layout/token spec; `app/s/[slug]/page.tsx` (currently the minimal Phase-1 version) should be rebuilt to match it.

**Pattern cited:** a BeReal/Lapse-style single-artifact result page — one large static image, one dominant CTA, no photo-viewer chrome (pinch-zoom, carousels, lightboxes) — crossed with this app's own Passport "page" framing, so a stranger's first view of the product reads as a leaf torn from someone's passport, not a marketing landing page.

**1. URL structure.** `/s/[slug]` — confirmed. `slug` is a short URL-safe token: **8 characters, base62 (`[A-Za-z0-9]`)**, generated server-side and checked for uniqueness against `strips.share_slug`. No ambiguous-character filtering beyond standard base62 is needed at 8 chars (collision space is ~2.1×10^14; retry-on-conflict is sufficient) — but if a human-readable variant is ever wanted, prefer a filtered alphabet (drop `0/O`, `1/l/I`) rather than lengthening the slug. Short matters for two concrete reasons already in the launch plan: (a) the story card bakes a **QR code** into the 1080×1920 canvas (`lib/sharecard.ts`) — QR density/scannability at typical print or on-screen size degrades fast past ~15-20 characters of payload, and a full domain + long slug pushes the module count up and shrinks the effective quiet zone; (b) **iMessage/SMS link previews and inline text wrapping** favor short URLs — a bureau-styled "present this reference" link should read like a terse manifest number, not a UUID. Full path stays short: `photoboothpassport.com/s/aB3xQ9kZ` (~34 chars incl. domain).

**2. OG-image requirements.** Each strip gets a server-generated `og:image` at **1200×630** (the standard link-unfurl size for iMessage/Twitter/Facebook/Slack). The strip itself is tall and narrow (`lib/composite.ts`: canvas is 720×2894, i.e. roughly **1:4** aspect — nowhere close to 1200×630's ~1.9:1 landscape ratio), so it must **never be stretched or cropped to fill the frame**. Treatment, following the precedent in `lib/sharecard.ts` (navy ground + double gold ceremonial border + cream/gold text + booth seal as the trust mark):
   - Background: the strip's own `booth.paper` cream tone (or the app's `cream` #F2ECDD if simplest server-side) with the `paperNoise()` grain, **not** navy — navy is reserved for the story-card/cover "binding" surface; the OG image is closer to "a strip photographed on a desk," so paper reads right.
   - The strip image is centered and **letterboxed** (scaled to fit height within a safe inset, e.g. ~560px tall within the 630px canvas, preserving its native 1:4 ratio), with a thin navy contact-stroke border (matching the strip's own 2px border) — not the strip's edges touching the frame.
   - The booth's circular seal stamp (`drawBoothStamp`, `lib/stamp.ts`) placed bottom-right of the strip, same convention as the strip footer and the story card.
   - No additional headline text baked into the image beyond what's already printed on the strip (booth name, serial, DATED line) — the image should read as "a photo of the actual artifact," not a marketing card with overlaid type. This also keeps the server-side render simple (compose once per strip, cache the PNG/JPEG in Storage next to the strip image).
   - `twitter:card` = `summary_large_image` (pairs with the 1200×630 image).
   - `og:title` / `og:description`: same officialese-meets-warmth voice as the rest of the app (see "Voice and world" above) — terse, treats the strip as a numbered record, never says "photo" or "post." Examples:
     - `og:title`: `"Admitted at Pier Pavilion — No. 00482"` (pattern: `Admitted at {booth.name} — No. {serial}`)
     - `og:description`: `"Four exposures. One strip. Stamped for keeps. Issued by The Grand Tour Company."` (reuse the existing tagline verbatim) or, if a caption exists: `"‘{caption}’ — stamped and filed at {booth.name}."`
   - The OG image is generated **server-side per strip** (not client canvas) — either at share-time (write once, store in Supabase Storage alongside the strip image, URL saved on the `strips` row) or on-demand via a Next.js OG image route (`opengraph-image.tsx` / `@vercel/og`) cached at the edge. Either is acceptable in Phase 2; Phase 1 only needs the `strips` row to have a stable place to hold (or derive) that URL.

**3. Full page layout (Phase 2 — supersedes the Phase-1 skeleton).**

Background: `cream` (#F2ECDD) + the standard `PaperTexture` grain overlay (mounted once, final child, per existing convention) — never `navy`. Navy is reserved for the Cover/story-card "binding" surface; this page is "the artifact examined on a desk," matching the OG-image reasoning in §2 above.

Layout, top to bottom, single column, `max-w-app` (430px), `px-5`, `pt-safe-lg`:

1. Eyebrow, centered: `THE GRAND TOUR COMPANY` — font-geo 10px, tracking 0.26em, `text-faded`.
2. H1, centered: **`ADMITTED — {BOOTH NAME}`** (e.g. `ADMITTED — PIER PAVILION`) — font-display bold uppercase, 22–24px depending on length, tracking 0.05em (looser tracking would clip on a 375px screen — the Cover's 0.16em is set for a two-line stack, not one line), `text-ink`; allow wrap to two lines rather than shrinking below 22px.
3. Meta line, centered, `mt-1`: **`No. {serial} · DATED {date}`** — font-geo 11.5px, tracking 0.12em, `text-ink-soft`. (Same string format already used in the story card's caption block — reuse verbatim, don't invent a new date format.)
4. Tagline, centered, `mt-2`: the strip's own caption in italic Playfair Display 15px `text-ink-soft`, quoted (`'{caption}'`), if one exists; otherwise the house tagline verbatim: *"Four exposures. One strip. Stamped for keeps."*
5. The framed strip, `mt-7`, centered: reuse the exact Passport "page" motif — a recessed panel (`border border-ink/25 border-l-2 border-l-ink/40 bg-cream-deep/45`, dashed left rule), ~24px internal padding, strip inside at `height: min(58dvh, 520px)` with `shadow-strip` and the standard `PhotoCorners`. This is deliberately the largest strip presentation anywhere in the app (Admitted uses 42dvh, Passport 40dvh) — it is the entire point of the page. No tap-to-zoom, no lightbox: a single static image is the whole interaction, per the cited pattern.
6. A faint booth-seal watermark inside the panel, bottom-right — reuse the exact `SessionIntro` convention verbatim (`pointer-events-none absolute bottom-2 right-2 w-[92px] rotate-[10deg] opacity-[0.13]`, `BoothStamp`). A trust mark, not a duplicate of the seal already baked into the strip's own footer.
7. Primary CTA, `mt-9`, `max-w-[330px]` centered: `PlateButton`, unchanged token set (`bg-navy text-paper font-display font-bold tracking-[0.18em] text-[15px] py-4 shadow-plate`), label **`Make your own at {booth.name} →`**. Deep-links into that booth's `SessionIntro` with the booth pre-selected (see "Referred first-run" below).
8. Reassurance line, `mt-3`, centered: font-geo 10.5px, tracking 0.22em, `text-faded` — **`NO SIGN-UP — THE CAMERA OPENS AT ONCE.`** (same slot/weight as `SessionIntro`'s `THE COUNTDOWN BEGINS AT ONCE`.)
9. Secondary link, `mt-5`, centered: `TypeLink` — **`SEE EVERY BOOTH →`**, `href="/"`.

**What NOT to do:** no navy background; no tap-to-zoom/pinch/lightbox; no second `PlateButton` or any element competing with the CTA; no login/signup prompt; no marketing copy beyond the one tagline line; no rounded corners or drop-shadow "card" around the page (the recessed dashed panel is the only framing device); don't render the booth seal large/dominant here — it already lives in the strip's own footer, so on this page it's a small watermark only.

---

### Story-card additions — QR + short-link

`lib/sharecard.ts` composes the 1080×1920 card; this spec covers ONLY the addition of a QR code + short-link line to that existing composer. Everything else in the file (background, ceremonial border, header lockup, strip placement/rotation/shadow, photo corners, fonts) is unchanged.

**Pattern cited:** an airline boarding-pass stub — a perforated tear-line separating a small barcode/QR "coupon" from the main pass — reused here as a "customs endorsement" band at the bottom of the card, so the QR reads as an official mark, not a slapped-on sticker.

**Constraint:** the canvas must stay exactly 1080×1920 (9:16) — Instagram/Snapchat/TikTok Stories crop or letterbox anything off-ratio. Governing rule: keep every new element's bottom edge at or above **y=1650** (~270px clear of the canvas bottom), because Stories' native reply-bar/sticker-tray UI overlays roughly the bottom 250px of a posted Story — a QR sitting in that band would be intermittently obscured and effectively unscannable in-app.

To open room inside the fixed 1920px height without crossing that ceiling, shrink `stripH` from `1280` to **`1000`** (stripW ≈249px at the strip's native 1:4.02 ratio — still by far the dominant vertical element) and shift the existing caption block up to close the gap:
- Booth name (italic Playfair, 40px, was 44px): y=1380
- Meta line (`No. {serial} · DATED {date}`, Jost 24px, was 26px): y=1420
- Seal (`drawBoothStamp`): radius 78→56, center `(930, 1400)`

New elements, all at or below y=1470:
- **Perforation rule**, y=1470, x 140–940: a row of small filled circles, radius 3px, pitch 34px, `${GOLD}` at 45% alpha — the same punch-dot proportions as `.perf-y` (2.1px dot / 13px pitch) scaled ~2.6× for this canvas's resolution. Inset narrower than the card's own gold border (140px vs the border's 64px) so it reads as a ticket-stub width, not a full-bleed rule.
- **QR chip**, x 140–292, y 1500–1652 (152×152px): a solid `CREAM` square with a 2px navy contact-stroke border (matching the strip's own border weight) — this is both the "official mark" backing and the QR's required light quiet zone. QR modules drawn **navy on cream** (never gold-on-navy) inside an 8px inset (136×136px module area) — dark-on-light is the scan-reliable polarity; low-contrast gold-on-navy risks failing to scan.
- **Text block**, x 320–940, vertically centered against the chip (~y 1520–1632):
  - `SCAN TO ENTER` — Jost 600 30px, gold, tracking 4px
  - the live share URL, host stripped of protocol — `photoboothpassport.com/s/{slug}` — Jost 500 30px, cream, tracking 0.5px
  - `PRESENT THIS CODE AT THE DOOR` — Jost 500 20px, gold at 70% alpha, tracking 2px

**QR payload:** the strip's share URL with `?utm_source=qr` appended (`.../s/{slug}?utm_source=qr`) — the visible URL text omits the query string (a clean human-readable line); only the encoded payload carries it. (Encoding itself needs a small client-side QR-drawing dependency not yet in `package.json`, e.g. `qrcode` — an implementation detail for frontend-shareloop, not a design decision.)

**What NOT to do:** don't draw the QR gold-on-navy (contrast/scan risk); don't let any new element's bottom edge cross y≈1650; don't grow the canvas past 1920 to make room; don't place bare QR modules directly on navy without the cream quiet-zone chip.

---

### Admitted screen — share dominance

**Pattern cited:** a Lapse/Dispo-style result screen — Share is the one full-width primary action; Save is a small secondary text link, never a peer button.

Smallest possible change: no new components, no new tokens — only relabel/reorder/re-space the existing `PlateButton`/`TypeLink` stack in `components/Admitted.tsx`.

1. `PlateButton` (unchanged token set) — label is now **always** `Share the strip` (drop the `Download the strip` fallback label entirely). Share stays the stated action even where the native share sheet isn't available — the fallback becomes "copy the share-page link," not "download a file."
2. `mt-2`, a single centered `TypeLink`: **`COPY LINK`** — copies the strip's `/s/[slug]` share-page URL to the clipboard. On tap, swap in a one-line gold confirmation using the existing `printNoted` convention (font-geo 10px, tracking 0.16em, `text-gold`): **`LINK COPIED — PASTE IT ANYWHERE.`** This sits tight beneath the `PlateButton` — "share via sheet" and "share via link" are siblings, not separate tiers — and is where the share-page URL copy affordance lives.
3. `mt-5` (was `mt-4` — one notch more separation, marking the tier change below), the existing row of three `TypeLink`s, unchanged style, **`DOWNLOAD` always shown** (currently gated behind `!canShare`; ungate it — download is a demoted option now, not share's fallback): `DOWNLOAD` · `STORY CARD 9:16` · `ORDER PRINTS`.
4. The existing `printNoted` line and the `MY PASSPORT →` / `THE BOOTHS` row: unchanged.

**What NOT to do:** don't resize or reweight any `TypeLink` relative to another — hierarchy comes from tier (`PlateButton` vs `TypeLink`), order, and proximity only, never from new font sizes; don't add icons (share glyph, link glyph — none exist in this system); don't duplicate the `PlateButton` or add a second full-width button.

---

### Referred first-run (visitor arriving via a shared strip)

**Decision: keep `SessionIntro`, don't skip it.** It carries real functional content — camera-use terms, the geo presence-check for exclusive booths, prompts/sound toggles — not tutorial fluff, and it's a single screen with one tap (`Begin the sitting`) before the camera opens, so it stays inside the <5s budget. No separate welcome modal, no tutorial overlay.

The only change for a referred visit: the `← DIRECTORY` row at the top of `SessionIntro` (a referred visitor didn't come from the directory) is replaced with one centered line, same weight class as the row it replaces:

**`ADMITTED ON THE RECOMMENDATION OF A FELLOW TRAVELLER`** — font-geo 10px, tracking 0.22em, `text-gold` (gold, not the usual `text-faded`, to read as a small warm welcome rather than a plain label), centered, not a tappable link.

Everything else on `SessionIntro` — the sitting card, terms of carriage, prompts/sound checkboxes, `Begin the sitting` CTA — is unchanged. The share page's CTA (`Make your own at {booth.name} →`) deep-links straight into this booth's `SessionIntro` with the booth pre-selected, skipping `BoothDirectory` entirely — directory selection is the only step actually removed for a referred visitor.

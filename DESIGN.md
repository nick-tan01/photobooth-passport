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

### `/s/[slug]` public share page — TODO

This is the highest-leverage new surface in the launch plan (Phase 2: the public, server-rendered landing page a shared strip/story-card link points to, with Open Graph tags and a "Make your own" CTA). Full layout/token spec to be written here before implementation begins — do not build this screen from this stub.

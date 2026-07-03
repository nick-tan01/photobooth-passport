# Photobooth Passport — Launch & First-Users Plan

*Goal: acquire real, engaged users (not revenue yet) for a B2C-leaning viral photobooth PWA. Ship on web first. Add a real backend (accounts + cloud gallery + charter management + analytics). Build a TikTok/Higgsfield content engine. Use design-reference tooling so the build has taste, not slop.*

---

## 0. The one insight that changes everything

The app is a beautifully made **local-only MVP**. Strips are saved to the browser's IndexedDB, unlocks live in localStorage, and the only server code (`/api/signal`) just prints anonymous event names to Vercel logs. Nothing the user makes can leave their phone in a form that pulls a *new* person in.

For a B2C app, the thing that acquires users is **not the camera — it's the share loop**. Every growth analysis of viral photo apps (BeReal, Lapse, Umax, Cal AI, RizzGPT) says the same thing: users spread the app by showing off a result, and new users arrive by seeing that result and thinking "I want to make one." Right now Photobooth Passport has *no shareable public artifact*. That is the single biggest gap, and closing it is the center of this plan.

So the plan is sequenced around building a **K-factor engine**:

> Someone makes a strip → shares a beautiful public strip page (branded, with a "Make your own" button) → a friend taps it → lands in a frictionless capture flow → makes their own → shares again.

Everything else (backend, accounts, TikTok, charters) exists to feed or measure that loop.

---

## 1. Definition of the "first customer"

Since money isn't the goal yet, we define three concrete acquisition milestones and optimize for them in order:

| Milestone | Definition | Target |
|---|---|---|
| **First user** | One person who isn't you completes a sitting and affixes a strip | Week 1 |
| **First loop** | One person arrives *from a shared link* and makes their own strip | Weeks 2–3 |
| **First cohort** | 100 people who each completed ≥1 sitting, with ≥1 organic share-driven signup | Weeks 4–6 |

The North Star metric is **share-driven signups / activated users (the K-factor)**. If K approaches or exceeds ~0.5, paid channels become optional and the app grows itself.

---

## 2. The stack (what to add, and why)

| Layer | Choice | Why |
|---|---|---|
| Hosting | **Vercel** (already linked: `prj_BV2E4BfTA6Rznx0geb5VzSsvi7oH`) | Zero-config Next.js, already set up |
| Domain | Custom domain (e.g. `photoboothpassport.com`) | Trust + brandable share links |
| Backend | **Supabase** | Postgres + Auth + Storage + Row-Level Security in one service; the 2026 consensus pick for a Next.js app on Vercel. Auth, cloud strip storage, charter tables, and analytics all live in one Postgres DB with shared RLS policies |
| Auth | Supabase Auth (`@supabase/ssr`), magic-link + Apple/Google | Frictionless; no password wall in front of the "aha" |
| Storage | Supabase Storage | Public bucket for shareable strip images, private bucket for user galleries |
| Analytics | Supabase table (events) + **PostHog** | Replace the `console.log` signal sink with a real funnel + retention view |
| Design taste | **Refero MCP / Refero Styles + DESIGN.md** | See §6 — gives the agent real references so UI isn't generic |
| Marketing video | **Higgsfield AI** | See §7 — short-form UGC/cinematic clips for TikTok |

Cost to run at first-users scale is effectively **$0–25/mo** (Supabase free tier, Vercel Hobby/Pro, one domain). Higgsfield is ~$15–84/mo *only when you're producing content*.

---

## 3. Phase 0 — Ship what exists (Days 1–2)

The app already builds and is Vercel-linked. Get it public before touching anything else, so there's a live URL to iterate against.

1. Push `main` to GitHub (repo already exists: `nick-tan01/photobooth-passport`).
2. Confirm the Vercel production deploy is green; fix any build/CSP issues.
3. Buy + attach a custom domain.
4. Smoke-test on a real iPhone and Android: camera permission, capture, strip composite, PWA install, safe-area insets.
5. Verify the PWA installs ("Add to Home Screen") and the service worker caches correctly.

**Exit criteria:** a stranger can open the URL on their phone, install it, complete a sitting, and see their strip. *This alone gets you your "first user."*

---

## 4. Phase 1 — Backend foundation (Week 1–2)

Stand up Supabase and wire the minimum needed for the share loop and measurement. Keep the app fully usable *without* an account (guest mode) — accounts are opt-in for sync and sharing, never a gate in front of the camera.

**Schema (starting point):**

- `profiles` — id, handle, display_name, created_at
- `strips` — id, owner_id (nullable for guests), booth_id, image_path, caption, date_text, serial, finish, created_at, **share_slug** (unique, public), is_public
- `booths` — mirror of the static config so booths/charters become data, not code (enables remote charter creation)
- `charters` — id, code, booth fields, owner/event metadata, valid_from/valid_to, redemptions_count
- `events` (analytics) — id, name, session_id, strip_id?, created_at, meta jsonb

**Endpoints / functions:**

- Upload strip image to Storage, create `strips` row, return a **public share URL** (`/s/[slug]`).
- Public server-rendered share page with Open Graph tags (image, title) so links unfurl beautifully in iMessage/TikTok/IG.
- Migrate `/api/signal` to write to the `events` table (and forward to PostHog).
- Charter redemption: validate code against `charters`, unlock booth, increment redemption count.

**Guest→account migration:** when a guest signs in, upload their local IndexedDB strips to their new account so nothing is lost. This preserves the existing offline-first design while adding sync.

**Exit criteria:** a strip can be saved to the cloud and opened by anyone via a public link that unfurls with a preview image.

---

## 5. Phase 2 — The share loop (the actual acquisition engine) (Week 2–3)

This is the highest-leverage work in the whole plan.

**Important — what already exists vs. what's missing.** The app *already* has a fully built 9:16 story-card composer (`lib/sharecard.ts`, 1080×1920, on-brand with photo corners and gold booth seal), the Web Share API is already wired in `Admitted.tsx` (share strip + share story card), and it already fires `strip_shared` / `story_card_shared` signals. **So the shareable asset is done.** What's missing is the thing that makes it a *loop*: the shared image is a **dead end** — it carries no link back, there's no public landing page, and there's no attribution. Closing that gap is the entire job of this phase.

Product changes, in priority order:

1. **Public share page `/s/[slug]`** — server-rendered, shows the strip large, the booth stamp, the serial, and a single dominant CTA: **"Make your own at [booth] →"**. Open Graph + Twitter card meta so the link itself is a mini-ad. *This is the missing piece — the destination the shared asset should point to.*
2. **Put the link into the share** — the existing share/story-card flow shares an image only; add the `/s/[slug]` short link (and/or a QR baked into the story card) so every share is a doorway, not a dead end.
3. **Make Share the dominant finish action** — the share UI exists; make it the single primary button on the Admitted screen (Save/Download demoted to secondary).
4. **Referral / "who admitted you" attribution** — capture the referring `share_slug` on arrival so you can measure K-factor and later reward referrers (e.g. unlock a locked booth for bringing a friend).
5. **Frictionless first run** — a shared-link visitor should be capturing within ~5 seconds: no signup, no tutorial, straight to the booth the sharer used. Account prompt comes *after* the aha, if at all.
6. **Passport as a public profile** (optional) — `/p/[handle]` shows a user's collected strips as a shareable gallery, giving power users a reason to keep coming back and to post their "collection."

**Exit criteria:** a friend can arrive from a shared link and make + share their own strip without ever hitting a wall. First-loop milestone achieved.

---

## 6. Phase 3 — Design taste layer (avoid AI slop) — runs *alongside* every phase

You already used **Refero** for a website; here's how to make it (and its ecosystem) part of the agent workflow so the build keeps its editorial, "Bureau of Memories" taste instead of drifting into default AI-app look.

The core idea (the **DESIGN.md** standard): coding agents write React/CSS fine, but they start from weak *visual* assumptions and regress to generic patterns. You fix this by giving the agent **concrete references before it generates code**, encoded as design tokens + prose.

Tooling to wire in:

- **Refero MCP** — connects the agent to 135,000+ real product screens and 10,000+ flows. Install it as an MCP server in Claude Code so the agent can pull references for a specific screen ("a vintage passport stamp page," "a photo-strip reveal") instead of inventing one.
- **Refero Styles** — 2,000+ AI-readable design systems exported as **DESIGN.md** (colors, typography, spacing, components). Pick the closest-matching system, drop its DESIGN.md into the repo, and point the agent at it.
- **Free reference libraries** for pulling screenshots when you want human curation: **Mobbin** and **Screenlane** (mobile flows), **Webframe** (full web apps), **Lapa Ninja** (landing pages), **Banani** (1,000+ mobile screens).

**How it plugs into the build:**

1. Create a `DESIGN.md` at the repo root that codifies the *existing* aesthetic already in the code — the cream paper, navy `#1F3A5F`, Playfair Display + Jost type pairing, the passport/ticket motifs, stamp textures. This locks the taste you already have so new screens match.
2. Give a dedicated **design subagent** the job of: pull references (Refero) → propose a visual spec (tokens + layout notes) → only then hand off to the frontend subagent to implement. Design decisions happen *before* code, not after.
3. Every new surface (share page, public passport, charter dashboard) gets a reference pulled and a short spec written before implementation. No "vague taste words" prompts.

This is what keeps the share page — the thing thousands of strangers will see — looking hand-made rather than templated.

---

## 7. Phase 4 — TikTok + Higgsfield content engine (Week 3+)

Research is unambiguous: for a B2C visual app, **TikTok UGC is the top acquisition channel**, and micro-influencers + native-feeling content beat paid ads for the first thousand users. Higgsfield is the production tool that makes this cheap.

**What Higgsfield gives you** (2026): one subscription aggregating 15+ video/image models (Sora 2, Veo 3.1, Kling 3.0, etc.), 70+ cinematic camera presets, and a **Marketing Studio** that turns a product URL into UGC-style / cinematic / CGI ad clips. Plans run ~$15–84/mo. Caveat: it produces *standalone clips*, not fully assembled narrated videos — you (or another agent) handle script, captions, and edit assembly.

**The content system:**

1. **Hero concept** — lean into the "Grand Tour Company / Bureau of Memories" world. This is a *narrative brand*, which is rare and inherently postable. Higgsfield's cinematic presets are perfect for vintage-travel, film-grain, sepia aesthetics.
2. **Content pillars:**
   - *Transformation/reveal* — the 4-exposure strip developing (the highest-converting format for photo apps).
   - *Booth-world lore* — short cinematic vignettes for each booth (Midnight Express on a night train, Niagara in the mist) generated in Higgsfield.
   - *Seasonal drops* — First Snow, Midsummer Lawn booths as timed launches (built-in seasonality is a content calendar for free).
   - *"POV: you got admitted"* — trend-native, uses the story card as the payoff.
3. **The loop back to product** — every video ends on the **story card** (Phase 2, item 3) with the link/QR. The video sells the vibe; the story card is the mechanism.
4. **Cadence** — start 1 video/day for 2 weeks to find what lands, then double down. Seed with 5–15 micro-influencers (nano/micro tiers are cheap and convert for first users).
5. **Measure** — UTM'd links + PostHog so you know which video drove which signups, and feed winners back into Higgsfield prompts.

---

## 8. Sequenced timeline

| When | Focus | Deliverable |
|---|---|---|
| Days 1–2 | Phase 0 | Live on custom domain, installable, first user |
| Week 1–2 | Phase 1 + Design layer | Supabase live, cloud strips, share URLs, DESIGN.md + Refero wired |
| Week 2–3 | Phase 2 | Full share loop; first share-driven signup |
| Week 3–4 | Phase 4 kickoff | First 10 TikToks via Higgsfield, 5 micro-influencers seeded |
| Week 4–6 | Iterate | Optimize K-factor, first 100-user cohort, seasonal drop |

---

## 9. What we are deliberately NOT doing yet

- **No payments** — money isn't the goal; adding Stripe now is a distraction. The `charter` and `finish` features are pre-built monetization surfaces for later.
- **No native iOS/TestFlight yet** — the PWA reaches users today with no App Store review. Wrap with Capacitor/Expo only after the web loop is proven (weeks, not day one).
- **No heavy account gating** — guest-first stays. Accounts are for sync/sharing, never a wall before the camera.

---

## 10. Risks & mitigations

- **iOS camera/PWA quirks** — Safari's `getUserMedia` and PWA install are fussier than Chrome. Test on real devices in Phase 0; this is why web-first still needs a real-device smoke test, not just desktop.
- **Share loop is weak if the artifact isn't beautiful** — hence the design layer (§6) gates the share page. A slop-looking share page kills K-factor.
- **TikTok is a slot machine** — no single video is guaranteed. Mitigate with volume (daily), a strong narrative brand, and measuring so winners compound.
- **Higgsfield produces clips, not finished videos** — budget time/an agent for edit assembly and captions.

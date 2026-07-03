# Claude Code — Build Instructions for Photobooth Passport

This file gives you copy-paste prompts to drive **Claude Code** (CLI or Desktop) to implement `LAUNCH_PLAN.md`. It uses a **goal + loop + subagent** structure so the model self-corrects instead of one-shotting.

> How to read this: §A sets up the repo so the agent has taste and rules. §B defines the subagents. §C is the master orchestration prompt (paste this to start). §D–§G are the per-phase prompts. §H is the self-correcting loop pattern. Run phases in order; each ends with a verifier gate.

---

## A. One-time setup (do this first)

### A1. Create `CLAUDE.md` at the repo root
Paste this so every session shares the same context:

```md
# CLAUDE.md — Photobooth Passport

## What this is
A Next.js 14 PWA "pocket photobooth." Users pick a themed booth, take 4 camera
exposures, get a composited photo strip, and collect strips in a "Passport."
Currently local-only (IndexedDB + localStorage); we are adding a backend and a
share loop. See LAUNCH_PLAN.md for the full plan.

## Prime directive
Every change must serve the acquisition loop: make → share a public strip →
friend arrives → makes their own. If a task doesn't feed or measure that loop,
question it.

## Hard rules
- Guest-first ALWAYS. Never put signup in front of the camera. Accounts are
  opt-in for sync/sharing only.
- Preserve the existing aesthetic. Read DESIGN.md before building any UI.
- Offline-first stays: keep IndexedDB working; the cloud is additive/sync.
- No secrets in the repo. Use env vars (.env.local, Vercel env, Supabase keys).
- TypeScript strict. No `any` without a comment justifying it.

## Stack
- Next.js 14 App Router, React 18, Tailwind, client-composited canvas strips.
- Supabase (Postgres + Auth + Storage + RLS) for backend.
- Vercel for hosting (project already linked in .vercel/).
- PostHog for product analytics.

## Definition of done for any phase
1. `npm run build` passes. 2. `npm run lint` passes. 3. Manual smoke test steps
listed. 4. The QA-verifier subagent signs off. 5. No regressions to the guest
capture flow.
```

### A2. Create `DESIGN.md` (taste, not slop)
Have the agent generate it from the *existing* code, then wire references:

```
Read app/globals.css, tailwind.config.ts, and 3-4 components (Cover, Passport,
Admitted, StripReveal). Extract the real design system into a DESIGN.md at the
repo root using the DESIGN.md standard (YAML front matter with design tokens +
prose explaining decisions). Capture: the cream paper palette, navy #1F3A5F,
Playfair Display + Jost pairing, passport/ticket/stamp motifs, film-grain and
paper textures, the "Bureau of Memories / Grand Tour Company" editorial voice.
This file is the source of truth for all new UI. Do NOT invent new styles that
conflict with it.
```

### A3. Wire design-reference tooling (so new screens have taste)
- Install **Refero MCP** as an MCP server in Claude Code (`refero.design/mcp`) so the agent can pull real product-screen references on demand.
- For each *new* surface (share page, public passport, charter dashboard), the design subagent must pull a reference and write a short visual spec into `DESIGN.md` (or `/design/specs/`) **before** any code is written.
- Free reference libraries to cite when curating by hand: Mobbin, Screenlane, Webframe, Lapa Ninja, Banani.

---

## B. Subagent roster

Define these as the specialized workers. In Claude Code you can create them as
subagents/`/agents`; the orchestrator delegates and never writes production code
itself.

1. **design-lead** — Pulls references (Refero), writes/updates DESIGN.md specs
   for each new surface BEFORE implementation. Guards the aesthetic. Read-only on
   code; writes specs.
2. **backend-engineer** — Supabase schema, migrations, RLS policies, storage
   buckets, server routes/edge functions, guest→account migration.
3. **frontend-shareloop** — Share page, story-card export, Web Share API, OG
   tags, referral attribution, frictionless first-run. Implements to DESIGN.md
   spec only.
4. **analytics** — Replace /api/signal with events table + PostHog; define the
   funnel (sitting_started → completed → affixed → shared → referred_signup) and
   a K-factor dashboard.
5. **devops-deploy** — Vercel config, env vars, domain, build/CSP fixes, PWA/
   service-worker correctness, preview deploys.
6. **qa-verifier** — The GATE. After each phase: runs build+lint, checks the
   phase's exit criteria, writes a manual test script, tries to break the guest
   flow, and returns PASS/FAIL with specifics. Nothing merges without PASS.

Rule: **design-lead runs before frontend-shareloop. qa-verifier runs after every
phase.** The orchestrator loops a phase until qa-verifier returns PASS.

---

## C. Master orchestration prompt (paste this to start)

```
You are the orchestrator for shipping Photobooth Passport per LAUNCH_PLAN.md.

Read LAUNCH_PLAN.md, CLAUDE.md, and DESIGN.md first. Then execute the phases
below IN ORDER. You do not write production code yourself — you delegate to
subagents (design-lead, backend-engineer, frontend-shareloop, analytics,
devops-deploy, qa-verifier) and integrate their work.

GOAL: reach the "first loop" milestone — a person arriving from a shared link
can make and share their own strip — with the existing aesthetic preserved and
guest-first intact.

LOOP CONTRACT for every phase:
  1. Plan: list the concrete changes and which subagent owns each.
  2. For any UI surface: design-lead writes/updates the DESIGN.md spec FIRST.
  3. Build: delegate to the owning subagent(s).
  4. Verify: qa-verifier runs build + lint + the phase exit criteria + a guest-
     flow regression check. It returns PASS or FAIL(reasons).
  5. If FAIL: fix the specific reasons and re-run step 4. Do NOT advance on FAIL.
  6. If PASS: commit with a clear message, then move to the next phase.

Stop and ask me only when you hit a decision that needs a human (domain name,
Supabase project creation, API keys, spending money). Otherwise keep looping
until all phases PASS. After each phase, post a 3-line status: what shipped,
what the qa-verifier said, what's next.

Start with Phase 0.
```

---

## D. Phase 0 prompt — Ship what exists

```
Phase 0 goal: the current app is live on a custom domain, installable as a PWA,
and works end-to-end on a real phone.

Delegate to devops-deploy:
- Ensure `npm run build` is green; fix any build/CSP/type errors.
- Confirm the Vercel production deploy works (project is already linked in
  .vercel/). Set up env var scaffolding for later (empty Supabase/PostHog keys).
- Prepare custom-domain attachment (ask me for the domain if not set).
- Verify PWA: manifest, service worker (public/sw.js) caching, install prompt,
  iOS safe-area insets.

qa-verifier exit criteria:
- Build + lint pass.
- A manual test script exists for: open on iPhone Safari + Android Chrome, grant
  camera, complete a 4-exposure sitting, see composited strip, affix, install to
  home screen. (I will run it on real devices and report back.)

Do not proceed to Phase 1 until PASS.
```

---

## E. Phase 1 prompt — Backend foundation

```
Phase 1 goal: strips can be saved to the cloud and opened by anyone via a public
link; analytics write to a real store; guests keep working without accounts.

design-lead: no new user-facing UI yet, but confirm the share URL structure
(/s/[slug]) and note OG-image requirements.

backend-engineer:
- Create Supabase project (ask me to create it / provide keys).
- Schema per LAUNCH_PLAN §4: profiles, strips (with unique share_slug, is_public),
  booths, charters, events. Write SQL migrations.
- RLS: public read on shared strips + public booths; owner-only on private data.
- Storage: public bucket `strips-public`, private bucket `strips-private`.
- Server route: upload composited strip image → create strips row → return
  public share URL.
- Guest→account migration: on first sign-in, upload local IndexedDB strips to the
  account. Keep IndexedDB as the offline cache.
- Auth: Supabase Auth via @supabase/ssr, magic-link + Apple/Google, opt-in only.

analytics:
- Replace /api/signal internals to insert into `events` and forward to PostHog.
- Keep the same signal() client API so no callers break.

qa-verifier exit criteria:
- Build + lint pass. A strip uploads, a share row is created, and the returned
  public URL loads for a logged-out user. Guest capture flow unchanged. RLS
  verified (a user cannot read another user's private strips).
```

---

## F. Phase 2 prompt — The share loop (highest leverage)

```
Phase 2 goal: a friend arriving from a shared link can make and share their own
strip with zero wall. This is the acquisition engine — spend the most care here.

design-lead FIRST:
- Pull references via Refero for: a public share/"result" page and a 9:16 story
  card. Write specs into DESIGN.md that match the existing Bureau aesthetic
  (cream/navy, Playfair+Jost, stamp motifs). No generic app look.

IMPORTANT — do NOT rebuild what exists. lib/sharecard.ts already composes an
on-brand 9:16 story card, and Admitted.tsx already wires the Web Share API and
fires strip_shared / story_card_shared. The asset is done. The gap is that the
shared image is a DEAD END: no link back, no landing page, no attribution. Close
that.

frontend-shareloop (implement to spec):
1. Public /s/[slug] page: server-rendered, big strip, booth stamp, serial, ONE
   dominant CTA "Make your own at [booth] →". Full Open Graph + Twitter card meta
   with the strip as the preview image so links unfurl. (This is the missing
   destination.)
2. Put the link INTO the share: extend the existing share/story-card flow to
   include the /s/[slug] short link, and bake a QR into the story card so every
   shared image is a doorway.
3. Make Share the single dominant button on Admitted; demote Save/Download to
   secondary. (Reuse the existing share() and shareStoryCard() functions.)
4. Referral attribution: capture the referring share_slug on arrival; store on
   the new session so K-factor is measurable.
5. Frictionless first-run: a shared-link visitor lands straight in the sharer's
   booth capture, <5s to shooting, no signup.
6. (Optional) Public passport /p/[handle] gallery.

analytics: add events referred_arrival, share_completed, referred_signup; build a
K-factor view (referred_signups / activated_users).

qa-verifier exit criteria:
- Build + lint pass. From a shared link on a fresh device/incognito: page unfurls
  with image, CTA lands in capture, a new strip can be made and shared, and a
  referred_arrival + referred_signup event fires. Guest flow intact.
```

---

## G. Phase 4 prompt — Content engine hooks (product side)

*(Phase 3 = design layer, already running throughout. Phase 4's product hooks:)*

```
Phase 4 goal (product side): make every shared asset a TikTok-ready ad and make
attribution airtight so Higgsfield/creator content is measurable.

frontend-shareloop + analytics:
- Ensure the story card is the payoff frame: booth branding, clean short link/QR,
  9:16, looks great screen-recorded.
- UTM-aware short links: /s/[slug]?utm_source=tiktok&utm_campaign=... captured
  into events so we know which video drove which signup.
- A simple internal /admin metrics page (auth-gated) showing funnel + K-factor +
  top referring slugs.

(The video production itself happens in Higgsfield, outside the repo — see
LAUNCH_PLAN §7. Optionally add a content/ folder with prompt templates for the
booth-lore cinematic clips.)

qa-verifier: UTM params survive the funnel and appear in analytics; admin metrics
page renders real numbers.
```

---

## H. The self-correcting loop pattern (why this works)

Each phase is a **goal-seek loop**, not a single instruction:

```
plan → (design spec if UI) → build → qa-verifier gate → PASS? commit : fix & re-verify
```

Rules that keep it honest:
- **The verifier is a different subagent than the builder.** The builder is
  biased toward "done"; the verifier's only job is to find what's broken. This
  separation is what prevents the model from declaring victory prematurely.
- **Exit criteria are concrete and testable**, not vibes. "The share link unfurls
  with an image and a logged-out user can open it" — pass/fail, no interpretation.
- **Guest-flow regression check every phase** — the one thing that must never
  break is a stranger's ability to make a strip.
- **Design happens before code** for every new surface — this is the specific
  guard against AI slop.
- **Human gates are explicit**: creating the Supabase project, buying a domain,
  API keys, and any spend pause the loop for you.

### Suggested run command (CLI)
Start Claude Code in the repo, ensure CLAUDE.md + DESIGN.md + LAUNCH_PLAN.md
exist, define the six subagents, then paste the **§C master prompt**. Let it run
Phase 0, review the status line, and continue. Keep sessions phase-scoped so
context stays tight.
```
claude
> [paste §A2 to generate DESIGN.md]
> [define subagents from §B]
> [paste §C master orchestration prompt]
```
```

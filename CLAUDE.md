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

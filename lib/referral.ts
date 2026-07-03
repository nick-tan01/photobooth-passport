"use client";

// Referral attribution for the share loop's inbound half: a visitor arrives
// via a shared strip's /s/[slug] page, taps its CTA to
// /?booth=<id>&ref=<slug>, and lands straight in that booth's SessionIntro
// (see app/page.tsx and DESIGN.md "New-surface specs > Referred first-run").
// This module is fire-and-forget plumbing only — every function is a no-op
// (never throws) when storage is unavailable, so it can never regress the
// guest capture flow.
//
// Three signals key off the referrer slug captured here (see lib/signals.ts
// for the full funnel taxonomy):
//   referred_arrival     fired once per browser session on arrival
//   referred_activation  fired once ever, on this visitor's first strip_affixed
//   referred_signup      fired once ever, on this visitor's first sign-in
import { signal } from "./signals";

const REF_KEY = "pp_ref"; // localStorage — persists for the referred visitor's lifetime
const ARRIVAL_GUARD_KEY = "pp_ref_arrival_fired"; // sessionStorage — once per tab session
const ACTIVATION_GUARD_KEY = "pp_ref_activation_fired"; // localStorage — once ever
const SIGNUP_GUARD_KEY = "pp_ref_signup_fired"; // localStorage — once ever

export interface Referrer {
  slug: string;
  ts: number;
}

export function getReferrer(): Referrer | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Referrer>;
    return typeof parsed.slug === "string" ? { slug: parsed.slug, ts: parsed.ts ?? 0 } : null;
  } catch {
    return null;
  }
}

// Called once on app load when a `ref` query param is present. Persists the
// referrer for this visitor's whole lifetime (survives reloads/new tabs) and
// fires referred_arrival at most once per browser tab session — a refresh
// on the same visit doesn't re-fire it.
export function captureReferral(refSlug: string) {
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ slug: refSlug, ts: Date.now() }));
  } catch {
    // best-effort; attribution just won't survive a reload
  }
  try {
    if (sessionStorage.getItem(ARRIVAL_GUARD_KEY)) return;
    sessionStorage.setItem(ARRIVAL_GUARD_KEY, "1");
  } catch {
    // sessionStorage unavailable — fall through and fire once best-effort
    // rather than never attributing the arrival at all
  }
  signal("referred_arrival", { share_slug: refSlug });
}

// Called on the first strip_affixed of any session. Fires referred_activation
// at most once EVER per referred visitor (a lifetime fact, not per-visit) —
// a no-op when this visitor was never referred or has already activated.
export function noteReferredActivation() {
  const ref = getReferrer();
  if (!ref) return;
  try {
    if (localStorage.getItem(ACTIVATION_GUARD_KEY)) return;
    localStorage.setItem(ACTIVATION_GUARD_KEY, "1");
  } catch {
    return; // can't guard reliably — skip rather than risk firing every affix
  }
  signal("referred_activation", { share_slug: ref.slug });
}

// Called from lib/auth.ts's sign-in success path. Fires referred_signup at
// most once ever per referred visitor. No auth UI calls this yet
// (guest-first — see CLAUDE.md); it's forward plumbing for the eventual
// account-sync surface.
export function noteReferredSignup() {
  const ref = getReferrer();
  if (!ref) return;
  try {
    if (localStorage.getItem(SIGNUP_GUARD_KEY)) return;
    localStorage.setItem(SIGNUP_GUARD_KEY, "1");
  } catch {
    return;
  }
  signal("referred_signup", { share_slug: ref.slug });
}

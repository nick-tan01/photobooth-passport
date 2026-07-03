// Privacy-light pilot instrumentation. Each signal increments a local
// tally (inspectable at any time) and fires an anonymous beacon to
// /api/signal, which validates/sanitizes it, inserts it into the Supabase
// `events` table, and (once a PostHog key is configured) forwards it to
// PostHog — see app/api/signal/route.ts. No PII: the only identifier is an
// anonymous, randomly-generated session id kept in localStorage.
//
// Funnel taxonomy (LAUNCH_PLAN.md §1 "K-factor engine" / §4 Phase 1 §E):
//
//   sitting_started      guest opens a booth and starts the 4-exposure sitting
//   sitting_completed    all 4 exposures captured, strip composited
//                        ("activated" for K-factor purposes — see
//                        supabase/views/analytics.sql)
//   strip_affixed        strip saved into the Passport (IndexedDB / cloud)
//   strip_shared          \ guest shares the strip image or the 9:16 story
//   story_card_shared     / card via the Web Share API — outbound half of
//                          the loop
//   referred_arrival     [Phase 2, not fired yet] a NEW visitor lands via a
//                        shared link (/s/[slug]) carrying share_slug/utm —
//                        inbound half of the loop
//   referred_signup      [Phase 2, not fired yet] that referred visitor
//                        creates an account / activates
//
// North Star: K-factor = referred_signup sessions / activated
// (sitting_completed) sessions. Phase 1 only lays the plumbing (session id,
// strip_id/share_slug/utm/meta fields, the events table + SQL views);
// referred_arrival and referred_signup start firing once Phase 2 builds the
// /s/[slug] attribution capture and the post-referral signup flow. Until
// then those two names are documented here but intentionally NOT added to
// SignalName below — no call site exists yet, and the existing signal names
// stay as-is per the Phase 1 scope.
//
// print_interest, charter_unlocked, presence_verified are secondary product
// signals outside the acquisition funnel — kept for visibility, not used in
// the K-factor math.

export type SignalName =
  | "sitting_started"
  | "sitting_completed"
  | "strip_affixed"
  | "strip_shared"
  | "story_card_shared"
  | "print_interest"
  | "charter_unlocked"
  | "presence_verified";

// Optional structured fields a call site can attach to a signal. All are
// optional so every existing `signal(name)` call site keeps working
// unchanged. These flow through to the `events` table's strip_id /
// share_slug / utm / meta columns (see app/api/signal/route.ts) for use by
// later phases (referral attribution, UTM survival, K-factor).
export interface SignalExtra {
  strip_id?: string;
  share_slug?: string;
  utm?: Record<string, string>;
  meta?: Record<string, string | number | boolean>;
}

const KEY = "pp-signals";
const SID_KEY = "pp_sid";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID — still anonymous,
  // just lower collision-resistance than a real UUID.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Lazily creates and persists an anonymous per-browser session id (no PII —
// just an opaque random token) so events can be grouped into sessions for
// funnel/K-factor math. Falls back to an ephemeral id if localStorage is
// unavailable (e.g. private browsing) rather than throwing.
function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SID_KEY);
    if (existing) return existing;
    const fresh = randomId();
    localStorage.setItem(SID_KEY, fresh);
    return fresh;
  } catch {
    return randomId();
  }
}

export function signal(name: SignalName, extra?: SignalExtra) {
  if (typeof window === "undefined") return;
  try {
    const tally: Record<string, number> = JSON.parse(
      localStorage.getItem(KEY) || "{}",
    );
    tally[name] = (tally[name] || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(tally));
  } catch {
    // tally is best-effort
  }
  try {
    const body = JSON.stringify({
      e: name,
      t: Date.now(),
      sid: getOrCreateSessionId(),
      ...extra,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/signal", body);
    } else {
      fetch("/api/signal", { method: "POST", body, keepalive: true }).catch(
        () => {},
      );
    }
  } catch {
    // network is best-effort too
  }
}

export function signalTallies(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

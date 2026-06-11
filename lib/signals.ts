// Privacy-light pilot instrumentation. Each signal increments a local
// tally (inspectable at any time) and fires an anonymous beacon to
// /api/signal, which just logs — no identifiers, no payload beyond the
// event name. Enough to measure the validation bar: sittings started /
// completed, strips saved / shared, print interest.

export type SignalName =
  | "sitting_started"
  | "sitting_completed"
  | "strip_affixed"
  | "strip_shared"
  | "story_card_shared"
  | "print_interest"
  | "charter_unlocked"
  | "presence_verified";

const KEY = "pp-signals";

export function signal(name: SignalName) {
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
    const body = JSON.stringify({ e: name, t: Date.now() });
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

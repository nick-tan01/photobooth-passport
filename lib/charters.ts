import type { Charter } from "./types";

// Private event booths, unlocked by booking reference. This static list is
// the offline/demo fallback — unlockCharter() below tries the live
// `charters` table (POST /api/charters/redeem) first, and only falls back
// to this array when the network is unavailable or Supabase isn't
// configured, so the VOYAGE demo keeps working fully offline either way.
export const CHARTERS: Charter[] = [
  {
    id: "charter-voyage",
    code: "VOYAGE",
    kind: "charter",
    glyph: "bunting",
    name: "The Maiden Voyage Ball",
    locale: "PRIVATE EVENT · BY INVITATION",
    stampLocale: "PRIVATE CHARTER",
    motto: "BLACK TIE, LOOSENED",
    tagline: "A private charter of the Grand Tour Company.",
    place: "A private engagement",
    prefix: "PVT",
    accent: "#7C3F4E",
    paper: "#F7F1E8",
    prompts: [
      "RAISE A TOAST",
      "BLACK TIE POSTURE",
      "CONFETTI INCOMING",
      "FIRST DANCE POSE",
      "SPEECH! SPEECH!",
      "CLINK GLASSES",
      "LAUGH AT THE BEST MAN",
      "MIDNIGHT COUNTDOWN",
    ],
  },
];

const KEY = "pp-charters";

// Stored value is an array of full Charter objects (not just codes), since
// a live-redeemed charter may not exist in the static CHARTERS list above.
// Older builds stored bare code strings; readStored() understands both.
function readStored(): Charter[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    const out: Charter[] = [];
    for (const entry of raw) {
      if (typeof entry === "string") {
        const found = CHARTERS.find((c) => c.code === entry);
        if (found) out.push(found);
      } else if (entry && typeof entry === "object" && "code" in entry) {
        out.push(entry as Charter);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function writeStored(charters: Charter[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(charters));
  } catch {
    // storage unavailable; unlock still works for this session via state
  }
}

export function unlockedCharters(): Charter[] {
  return readStored();
}

async function redeemRemote(code: string): Promise<Charter | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/charters/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      ok: boolean;
      charter?: Omit<Charter, "id"> & { id: string };
    };
    if (!data.ok || !data.charter) return null;

    // Prefer the static entry's id/shape when the code matches one shipped
    // in code — keeps getBooth()/lib/booths.ts id lookups working
    // everywhere a strip's boothId is resolved later (e.g. Passport.tsx).
    // Only a charter that exists solely in the database (created via
    // future admin tooling, not yet supported by those static lookups)
    // falls through to the synthesized "charter-<uuid>" id.
    const known = CHARTERS.find((c) => c.code === data.charter!.code);
    if (known) return known;
    return { ...data.charter, id: `charter-${data.charter.id}`, kind: "charter" } as Charter;
  } catch {
    return null; // offline / env-less / server error — caller falls back locally
  }
}

// Returns the charter on success, null on an unknown reference. Tries the
// live `charters` table first (POST /api/charters/redeem, which also
// enforces the valid_from/valid_to window and increments redemptions_count
// server-side); falls back to the static CHARTERS list above when the
// network is unreachable or Supabase isn't configured.
export async function unlockCharter(input: string): Promise<Charter | null> {
  const code = input.trim().toUpperCase();
  if (!code) return null;

  const remote = await redeemRemote(code);
  const charter = remote ?? CHARTERS.find((c) => c.code === code) ?? null;
  if (!charter) return null;

  const existing = readStored();
  if (!existing.some((c) => c.code === charter.code)) {
    writeStored([...existing, charter]);
  }
  return charter;
}

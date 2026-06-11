import type { Charter } from "./types";

// Private event booths, unlocked by booking reference. For the pilot these
// ship as static config; a booth registry backend replaces this later.
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

export function unlockedCharters(): Charter[] {
  try {
    const codes: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    return CHARTERS.filter((c) => codes.includes(c.code));
  } catch {
    return [];
  }
}

// returns the charter on success, null on an unknown reference
export function unlockCharter(input: string): Charter | null {
  const code = input.trim().toUpperCase();
  const charter = CHARTERS.find((c) => c.code === code);
  if (!charter) return null;
  try {
    const codes: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!codes.includes(code)) {
      codes.push(code);
      localStorage.setItem(KEY, JSON.stringify(codes));
    }
  } catch {
    // storage unavailable; unlock still works for this session via state
  }
  return charter;
}

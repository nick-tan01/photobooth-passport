// Anonymous pilot counters. Events land in Vercel function logs; no
// storage, no identifiers. Swap for a real sink (KV/Tinybird) if the
// pilot graduates.
export async function POST(req: Request) {
  try {
    // Cap the body so a huge payload can't be buffered, and only accept the
    // expected small JSON beacon shape { e: string, t?: number }.
    const raw = (await req.text()).slice(0, 512);
    let event = "";
    try {
      const parsed = JSON.parse(raw) as { e?: unknown };
      if (typeof parsed?.e === "string") event = parsed.e.slice(0, 64);
    } catch {
      // not JSON — ignore
    }
    // Whitelist to printable, log-safe characters so a beacon can't inject
    // newlines/control chars and forge extra log lines.
    const safe = event.replace(/[^A-Za-z0-9 _.:-]/g, "");
    if (safe) console.log("[signal]", safe);
  } catch {
    // ignore malformed beacons
  }
  return new Response(null, { status: 204 });
}

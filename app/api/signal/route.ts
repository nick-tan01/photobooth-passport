// Anonymous pilot counters. Events land in Vercel function logs; no
// storage, no identifiers. Swap for a real sink (KV/Tinybird) if the
// pilot graduates.
export async function POST(req: Request) {
  try {
    const body = await req.text();
    console.log("[signal]", body.slice(0, 200));
  } catch {
    // ignore malformed beacons
  }
  return new Response(null, { status: 204 });
}

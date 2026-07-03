import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Validates a booking reference against the live `charters` table and, on
// success, increments its redemption count. All of the actual logic
// (window check, redemption cap, atomic increment) lives in the
// security-definer redeem_charter() RPC — this route just calls it. The
// charters table itself has no client SELECT policy, so this RPC is the
// only way to read a code's validity.
export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "unavailable" },
      { status: 503 },
    );
  }

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().slice(0, 20) : "";
  if (!code) {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("redeem_charter", { p_code: code });
  if (error) {
    return NextResponse.json({ ok: false, reason: "error" }, { status: 500 });
  }

  return NextResponse.json(data);
}

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Magic-link (PKCE) callback: exchanges the ?code= param for a session,
// stored in cookies via lib/supabase/server.ts, then redirects back into
// the app. No UI links here yet (Phase 1 is plumbing-only); this route
// only does anything once a future sign-in surface sends users through it.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

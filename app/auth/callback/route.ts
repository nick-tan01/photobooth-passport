import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Magic-link (PKCE) callback: exchanges the ?code= param for a session,
// stored in cookies via lib/supabase/server.ts, then redirects back into
// the app. No UI links here yet (Phase 1 is plumbing-only); this route
// only does anything once a future sign-in surface sends users through it.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // `next` is attacker-controlled (it's an echoed query param) — only
  // accept a same-site relative path. A value like "@evil.com" would
  // otherwise be concatenated straight into the Location header and
  // resolve to `https://<site>@evil.com` (host as userinfo); "//evil.com"
  // or "/\\evil.com" are protocol-relative/backslash tricks browsers also
  // treat as a scheme change. Anything else falls back to "/".
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\")
      ? rawNext
      : "/";

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

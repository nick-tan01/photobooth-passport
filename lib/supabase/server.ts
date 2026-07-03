import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Server-side (Route Handlers / Server Components) Supabase client, using
// the anon key plus the caller's auth cookies — RLS enforces everything
// this is allowed to do; no service role is used or required. Returns null
// when env vars are absent so callers can degrade gracefully (e.g. the
// /s/[slug] page 404s instead of throwing, /api/strips returns a clear 503).
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render (no response to attach
          // cookies to, e.g. the /s/[slug] page) — safe to ignore. Session
          // refresh, if any, simply retries on the next request that goes
          // through a Route Handler.
        }
      },
    },
  });
}

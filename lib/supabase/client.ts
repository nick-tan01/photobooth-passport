"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

// Browser-side Supabase client (anon key only). Returns null when env vars
// are absent so cloud features can no-op instead of throwing — the guest /
// offline flow must never break because Supabase isn't configured.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = url && key ? createBrowserClient(url, key) : null;
  return cached;
}

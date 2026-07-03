"use client";

// Auth plumbing only — no UI in this phase (see CLAUDE.md: never put
// signup in front of the camera). These helpers exist so a future
// account-sync surface can call straight through. Every function degrades
// to a harmless no-op/false when Supabase env vars are absent.

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export async function signInWithMagicLink(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "cloud unavailable" };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo:
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined,
    },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

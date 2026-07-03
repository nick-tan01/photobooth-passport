"use client";

// Auth plumbing only — no UI in this phase (see CLAUDE.md: never put
// signup in front of the camera). These helpers exist so a future
// account-sync surface can call straight through. Every function degrades
// to a harmless no-op/false when Supabase env vars are absent.

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { noteReferredSignup } from "@/lib/referral";
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

// The sign-in success path: attaches a listener that fires
// referred_signup (see lib/referral.ts) the moment a session actually
// appears, whether from this tab's own sign-in or a magic-link redirect
// completing in /auth/callback. Plumbing only — no auth UI calls this yet
// (guest-first, see CLAUDE.md), so for every guest today this is a no-op
// listener that never fires. Safe to call multiple times; returns an
// unsubscribe function (a no-op when Supabase isn't configured).
export function watchReferredSignup(): () => void {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return () => {};
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") noteReferredSignup();
  });
  return () => subscription.unsubscribe();
}

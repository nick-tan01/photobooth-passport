"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE } from "@/lib/admin";

// Backs the /admin key-gate form (app/admin/Gate.tsx). Validates the
// submitted key against admin_metrics() (the same RPC the Ledger itself
// reads from — see supabase/migrations/0012_admin_metrics.sql) and, on
// success, stores the raw key in an httpOnly cookie so the page component
// can re-call the RPC on subsequent loads. Never touches localStorage,
// never puts the key in a URL.
export async function presentKey(formData: FormData): Promise<void> {
  const raw = formData.get("key");
  const key = typeof raw === "string" ? raw.trim() : "";

  if (!key) {
    redirect("/admin?error=invalid");
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    // Env-less degradation: no crash, an in-voice "closed" state instead.
    redirect("/admin?error=unavailable");
  }

  const { data, error } = await supabase.rpc("admin_metrics", { p_key: key });
  if (error || !data) {
    redirect("/admin?error=invalid");
  }

  cookies().set(ADMIN_COOKIE_NAME, key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });

  redirect("/admin");
}

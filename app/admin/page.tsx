import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE_NAME, type AdminMetrics } from "@/lib/admin";
import Gate from "./Gate";
import Ledger from "./Ledger";

// Internal-only surface — DESIGN.md "### /admin — Bureau Ledger (internal)
// — Phase 4 spec". Never indexed.
export const metadata: Metadata = {
  title: "Bureau of Records",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawError = searchParams?.error;
  const queryError = Array.isArray(rawError) ? rawError[0] : rawError;
  const gateError = queryError === "invalid" || queryError === "unavailable" ? queryError : undefined;

  const key = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!key) {
    return <Gate error={gateError} />;
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <Gate error="unavailable" />;
  }

  const { data, error } = await supabase.rpc("admin_metrics", { p_key: key });
  if (error || !data) {
    // A stale/rotated key sitting in the cookie reads identically to "never
    // presented one" — the gate can't distinguish, so it falls back to the
    // same rejection copy as a fresh wrong-key submission.
    return <Gate error={gateError ?? "invalid"} />;
  }

  return <Ledger metrics={data as AdminMetrics} />;
}

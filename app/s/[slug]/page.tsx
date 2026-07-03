/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getBooth } from "@/lib/booths";

// Minimal Phase 1 share page: server-rendered, shows the strip + booth name
// + a "Make your own" link back to the app, with basic OG/Twitter meta
// pointing at the stored strip image. The full styled version (dedicated
// 1200x630 OG image, layout/type spec) is Phase 2 — see DESIGN.md
// "New-surface specs > /s/[slug]" ("do not build a styled version of this
// screen from this note").
export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

async function getStrip(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("strips")
    .select("booth_id, image_path, serial")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;

  const { data: pub } = supabase.storage
    .from("strips-public")
    .getPublicUrl(data.image_path);

  return { ...data, imageUrl: pub.publicUrl };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const strip = await getStrip(params.slug);
  if (!strip) return { title: "Photobooth Passport" };

  const booth = getBooth(strip.booth_id);
  const title = `Admitted at ${booth.name} — No. ${strip.serial || "—"}`;
  const description = "A record from THE GRAND TOUR COMPANY. Make your own.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: strip.imageUrl ? [strip.imageUrl] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: strip.imageUrl ? [strip.imageUrl] : [],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const strip = await getStrip(params.slug);
  if (!strip) notFound();

  const booth = getBooth(strip.booth_id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col items-center bg-cream px-5 pb-10 pt-safe-lg">
      <p className="font-geo text-[10px] tracking-[0.26em] text-faded">
        THE GRAND TOUR COMPANY
      </p>
      <h1 className="mt-1 text-center font-display text-[22px] font-semibold text-ink">
        {booth.name}
      </h1>
      {strip.serial && (
        <p className="mt-1 font-geo text-[11px] tracking-[0.12em] text-ink-soft">
          No. {strip.serial}
        </p>
      )}

      {strip.imageUrl && (
        <img
          src={strip.imageUrl}
          alt={`Photo strip from ${booth.name}`}
          className="mt-6 w-auto shadow-strip"
          style={{ maxHeight: "60dvh" }}
        />
      )}

      <a
        href="/"
        className="press mt-9 block w-full max-w-[330px] border border-navy-deep bg-navy px-6 py-4 text-center font-display text-[15px] font-bold uppercase tracking-[0.18em] text-paper shadow-plate"
      >
        Make your own →
      </a>
    </main>
  );
}

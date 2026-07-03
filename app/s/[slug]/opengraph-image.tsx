import { ImageResponse } from "next/og";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getBooth } from "@/lib/booths";
import { STRIP_ASPECT } from "@/lib/composite";

// Server-generated 1200x630 og:image / twitter:image — DESIGN.md
// "New-surface specs > /s/[slug] > OG-image requirements". The strip is
// tall/narrow (~1:4) so it's letterboxed on its own booth.paper cream tone
// (never navy — navy is reserved for the story-card/cover "binding"
// surface) rather than stretched or cropped to fill the 1200x630 frame.
//
// Simplification note: the booth seal here is a plain circular badge, not
// the hand-inked lib/stamp.ts SVG (feTurbulence/feDisplacementMap ink-bleed
// filter) — satori (next/og's renderer) doesn't support SVG filter
// primitives, so the exact stamp can't be reproduced pixel-for-pixel in
// this render path. It keeps the same "circular seal, bottom-right" trust
// mark convention.
export const alt = "A photo strip from Photobooth Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { slug: string };
}

async function getStrip(slug: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("strips")
    .select("booth_id, image_path")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (!data) return null;
  const { data: pub } = supabase.storage
    .from("strips-public")
    .getPublicUrl(data.image_path);
  return { boothId: data.booth_id as string, imageUrl: pub.publicUrl };
}

export default async function OgImage({ params }: Props) {
  const strip = await getStrip(params.slug);
  const booth = strip ? getBooth(strip.boothId) : null;
  const paper = booth?.paper ?? "#F2ECDD";
  const navy = "#1F3A5F";

  const stripDisplayH = 560;
  const stripDisplayW = Math.round(stripDisplayH / STRIP_ASPECT);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: paper,
          position: "relative",
        }}
      >
        {strip?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={strip.imageUrl}
            alt=""
            width={stripDisplayW}
            height={stripDisplayH}
            style={{
              border: `2px solid ${navy}`,
              boxShadow: "0 4px 24px rgba(20,36,58,0.28)",
            }}
          />
        ) : (
          <div style={{ display: "flex", fontSize: 40, color: navy }}>
            Photobooth Passport
          </div>
        )}
        {booth && (
          <div
            style={{
              position: "absolute",
              right: 56,
              bottom: 44,
              width: 92,
              height: 92,
              borderRadius: "50%",
              border: `2px solid ${booth.accent}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: booth.accent,
              fontSize: 9,
              letterSpacing: 1,
              textTransform: "uppercase",
              textAlign: "center",
              padding: 6,
            }}
          >
            <div style={{ display: "flex" }}>{booth.name}</div>
            <div style={{ display: "flex", marginTop: 4, fontSize: 8, opacity: 0.8 }}>
              {booth.stampLocale}
            </div>
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}

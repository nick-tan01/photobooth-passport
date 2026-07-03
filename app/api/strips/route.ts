import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { FINISHES, type FinishId } from "@/lib/filters";

// Uploads a composited strip image to Storage, inserts a `strips` row, and
// returns a public share URL (/s/[slug]). Guest-uploadable (owner_id stays
// null unless a session cookie identifies a signed-in user) — RLS enforces
// everything this route is allowed to do; it uses the anon key only.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — matches the strips-public bucket limit
const MAX_ATTEMPTS = 5;

const MAGIC: { mime: string; ext: string; check: (b: Uint8Array) => boolean }[] = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: "image/webp",
    ext: "webp",
    check: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

function sniffImage(bytes: Uint8Array) {
  return MAGIC.find((m) => m.check(bytes)) ?? null;
}

function siteUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

function str(v: FormDataEntryValue | null, max: number): string {
  if (typeof v !== "string") return "";
  return v.slice(0, max).trim();
}

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "cloud unavailable" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("image");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "missing image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "image too large (5MB max)" },
      { status: 413 },
    );
  }

  const boothId = str(form.get("booth_id"), 64);
  if (!boothId || !/^[a-zA-Z0-9_-]{1,64}$/.test(boothId)) {
    return NextResponse.json(
      { error: "missing or invalid booth_id" },
      { status: 400 },
    );
  }

  const caption = str(form.get("caption"), 280);
  const dateText = str(form.get("date_text"), 64);
  const serial = str(form.get("serial"), 32);
  const finishRaw = str(form.get("finish"), 16);
  const finish: FinishId = FINISHES.some((f) => f.id === finishRaw)
    ? (finishRaw as FinishId)
    : "gloss";

  const buf = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImage(buf);
  if (!sniffed) {
    return NextResponse.json(
      { error: "unrecognized image format" },
      { status: 400 },
    );
  }

  let ownerId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    ownerId = data?.user?.id ?? null;
  } catch {
    ownerId = null; // no session — guest upload
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slug = generateSlug();
    const path = `${slug}.${sniffed.ext}`;

    const { error: uploadError } = await supabase.storage
      .from("strips-public")
      .upload(path, buf, { contentType: sniffed.mime, upsert: false });

    if (uploadError) {
      if (attempt < MAX_ATTEMPTS - 1) continue; // extremely unlikely path collision — retry with a new slug
      return NextResponse.json({ error: "upload failed" }, { status: 500 });
    }

    const { data: row, error: insertError } = await supabase
      .from("strips")
      .insert({
        owner_id: ownerId,
        booth_id: boothId,
        image_path: path,
        caption: caption || null,
        date_text: dateText || null,
        serial: serial || null,
        finish,
        share_slug: slug,
      })
      .select("share_slug")
      .single();

    if (insertError) {
      // The anon key has no DELETE policy on strips-public (see
      // 0009_storage.sql), so this object is orphaned on insert failure —
      // expected and harmless, same cost as the documented test JPEGs.
      // Nothing ever reads a storage object without a corresponding strips
      // row, so an orphan is inert, just unreclaimed bytes.
      if (insertError.code === "23505" && attempt < MAX_ATTEMPTS - 1) continue; // slug collision — retry
      return NextResponse.json({ error: "save failed" }, { status: 500 });
    }

    return NextResponse.json({
      slug: row.share_slug,
      url: `${siteUrl(req)}/s/${row.share_slug}`,
    });
  }

  return NextResponse.json(
    { error: "could not allocate a share slug" },
    { status: 500 },
  );
}

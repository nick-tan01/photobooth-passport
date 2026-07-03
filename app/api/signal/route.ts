import { getSupabaseServerClient } from "@/lib/supabase/server";

// Analytics sink for the client signal() beacon (lib/signals.ts).
//
// Pipeline: validate/sanitize the beacon -> insert into the `events` table
// (Supabase, anon key; RLS is insert-only, see
// supabase/migrations/0008_events.sql) -> if Supabase is unavailable or the
// insert fails, degrade to the pre-Phase-1 console.log behavior -> if
// PostHog env vars are configured, ALSO forward the event server-side
// (fire-and-forget; dormant today because NEXT_PUBLIC_POSTHOG_KEY is unset).
//
// Always responds 204 regardless of outcome: a beacon has no meaningful
// error path for the caller, and analytics must never block or slow the
// guest capture flow.

const MAX_BODY_CHARS = 4096; // generous enough for a small utm/meta object, still bounded
const MAX_NAME_LEN = 64;
const MAX_ID_LEN = 128; // matches events.session_id column cap
const MAX_SLUG_LEN = 32; // matches events.share_slug column cap
const MAX_META_KEYS = 20;
const MAX_KEY_LEN = 64;
const MAX_VALUE_LEN = 256;

// Whitelist to printable, log-safe characters so a beacon can't inject
// newlines/control chars and forge extra log lines or corrupt jsonb values.
const NAME_CHARS_RE = /[^A-Za-z0-9 _.:-]/g;
const ID_CHARS_RE = /[^A-Za-z0-9_-]/g;
// Free-form values (utm params, meta strings) need a couple of extra
// characters that legitimately show up in URLs/campaign names.
const VALUE_CHARS_RE = /[^A-Za-z0-9 _.:/?=&%-]/g;
const KEY_RE = /^[A-Za-z0-9_]{1,64}$/;
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type JsonPrimitive = string | number | boolean;

interface ParsedEvent {
  name: string;
  session_id: string | null;
  strip_id: string | null;
  share_slug: string | null;
  utm: Record<string, JsonPrimitive> | null;
  meta: Record<string, JsonPrimitive> | null;
}

function sanitizeName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.slice(0, MAX_NAME_LEN).replace(NAME_CHARS_RE, "");
}

function sanitizeId(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const v = raw.slice(0, max).replace(ID_CHARS_RE, "");
  return v || null;
}

function sanitizeUuid(raw: unknown): string | null {
  return typeof raw === "string" && UUID_RE.test(raw) ? raw : null;
}

// Sanitizes a flat, one-level object of string/number/boolean values.
// Nested objects/arrays are dropped (jsonb columns here are meant to stay
// flat and small) rather than failing the whole event.
function sanitizeFlatObject(
  raw: unknown,
  allowedKeys?: readonly string[],
): Record<string, JsonPrimitive> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, JsonPrimitive> = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_META_KEYS) break;
    if (!KEY_RE.test(key) || key.length > MAX_KEY_LEN) continue;
    if (allowedKeys && !allowedKeys.includes(key)) continue;
    if (typeof value === "string") {
      const v = value.slice(0, MAX_VALUE_LEN).replace(VALUE_CHARS_RE, "");
      if (!v) continue;
      out[key] = v;
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value;
    } else {
      continue;
    }
    count++;
  }
  return Object.keys(out).length ? out : null;
}

async function parseBeacon(req: Request): Promise<ParsedEvent | null> {
  try {
    // Cap the body so a huge payload can't be buffered.
    const raw = (await req.text()).slice(0, MAX_BODY_CHARS);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const name = sanitizeName(body.e);
    if (!name) return null;
    return {
      name,
      session_id: sanitizeId(body.sid, MAX_ID_LEN),
      strip_id: sanitizeUuid(body.strip_id),
      share_slug: sanitizeId(body.share_slug, MAX_SLUG_LEN),
      utm: sanitizeFlatObject(body.utm, UTM_KEYS),
      meta: sanitizeFlatObject(body.meta),
    };
  } catch {
    return null; // not JSON, or malformed — ignore
  }
}

function forwardToPostHog(event: ParsedEvent) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return; // dormant until a key is configured

  const properties: Record<string, unknown> = { ...(event.meta ?? {}) };
  if (event.strip_id) properties.strip_id = event.strip_id;
  if (event.share_slug) properties.share_slug = event.share_slug;
  if (event.utm) Object.assign(properties, event.utm);

  // Deliberately not awaited by the caller — the response must never wait
  // on a third-party network call. (Note for whoever flips the key on:
  // on Vercel's Node.js runtime a detached, un-awaited fetch after the
  // response is sent isn't 100%-guaranteed to finish; if PostHog delivery
  // needs to be reliable, wrap this in `waitUntil`/Next's `after()`.)
  fetch(`${host.replace(/\/$/, "")}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      event: event.name,
      distinct_id: event.session_id ?? "anonymous",
      properties,
    }),
  }).catch(() => {
    // best-effort — analytics must never surface an error to the caller
  });
}

export async function POST(req: Request) {
  const parsed = await parseBeacon(req);
  if (!parsed) return new Response(null, { status: 204 });

  let inserted = false;
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("events").insert({
        name: parsed.name,
        session_id: parsed.session_id,
        strip_id: parsed.strip_id,
        share_slug: parsed.share_slug,
        utm: parsed.utm,
        meta: parsed.meta,
      });
      inserted = !error;
    }
  } catch {
    inserted = false;
  }

  if (!inserted) {
    // Supabase env absent or the insert failed — degrade to the
    // pre-Phase-1 console sink so the event isn't silently lost from local
    // dev/Vercel function logs. Analytics must never break the app.
    console.log("[signal]", parsed.name);
  }

  forwardToPostHog(parsed);

  return new Response(null, { status: 204 });
}

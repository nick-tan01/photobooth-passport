"use client";

// Upload-on-share-intent: a strip's photos never leave the device until the
// guest actually taps a share action (see CLAUDE.md guest-first rule + the
// Phase 2 brief's orchestrator decision #1 — privacy: no silent background
// uploads on affix). The FIRST share action for a strip (share sheet, story
// card, or copy-link) uploads it via the existing POST /api/strips and
// caches the returned slug/URL on that strip's IndexedDB record; every
// later share of the same strip reuses the cached value instead of
// re-uploading.
//
// Never throws: offline, an env-less deploy (no Supabase configured), or a
// server error all resolve to `null`, and callers fall back to the
// pre-existing image-only share/download path.
import type { Booth } from "./types";
import { getStrip, updateStripShare } from "./storage";

export interface ShareTarget {
  slug: string;
  url: string;
}

// Dedupes concurrent share taps (e.g. the user taps Share and Copy Link in
// quick succession before the first upload resolves) so only one POST goes
// out per strip, keyed by the strip's local IndexedDB id.
const inFlight = new Map<string, Promise<ShareTarget | null>>();

async function uploadStrip(params: {
  blob: Blob;
  booth: Booth;
  serial: string;
  dateText: string;
  caption: string;
}): Promise<ShareTarget | null> {
  try {
    const form = new FormData();
    form.set("image", params.blob, `${params.serial || "strip"}.jpg`);
    form.set("booth_id", params.booth.id);
    form.set("caption", params.caption ?? "");
    form.set("date_text", params.dateText ?? "");
    form.set("serial", params.serial ?? "");
    const res = await fetch("/api/strips", { method: "POST", body: form });
    if (!res.ok) return null;
    const data = (await res.json()) as { slug?: string; url?: string };
    if (!data.slug || !data.url) return null;
    return { slug: data.slug, url: data.url };
  } catch {
    return null; // offline, CSP-blocked, env-less 503, etc. — all degrade the same way
  }
}

export async function ensureShareTarget(
  stripId: string,
  blob: Blob,
  booth: Booth,
  serial: string,
  dateText: string,
  caption: string,
): Promise<ShareTarget | null> {
  if (!stripId) {
    return uploadStrip({ blob, booth, serial, dateText, caption });
  }

  try {
    const rec = await getStrip(stripId);
    if (rec?.shareSlug && rec?.shareUrl) {
      return { slug: rec.shareSlug, url: rec.shareUrl };
    }
  } catch {
    // IndexedDB unavailable — fall through to a fresh upload; just can't
    // check (or later write) the cache this time.
  }

  const existing = inFlight.get(stripId);
  if (existing) return existing;

  const promise = uploadStrip({ blob, booth, serial, dateText, caption })
    .then(async (target) => {
      if (target) {
        try {
          await updateStripShare(stripId, target);
        } catch {
          // caching is best-effort; the upload itself already succeeded
        }
      }
      return target;
    })
    .finally(() => inFlight.delete(stripId));

  inFlight.set(stripId, promise);
  return promise;
}

"use client";

// Guest -> account migration. Called once after a first sign-in (from a
// future account-sync surface — no UI wires this yet in Phase 1). Reads
// every local IndexedDB strip (lib/storage.ts) and uploads it through the
// same POST /api/strips path used everywhere else, tagging each with the
// now-signed-in owner (the route reads the session cookie server-side —
// this file never sends an owner_id itself). IndexedDB remains the offline
// cache; this only copies to the cloud, never deletes locally.
//
// Idempotent: already-migrated local strip ids are tracked in localStorage
// so a repeat login doesn't re-upload (and doesn't duplicate) them.

import { listStrips } from "@/lib/storage";
import type { StripRecord } from "@/lib/types";

const MIGRATED_KEY = "pp-migrated-strips";

function migratedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(MIGRATED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markMigrated(ids: string[]) {
  try {
    const all = new Set([...migratedIds(), ...ids]);
    localStorage.setItem(MIGRATED_KEY, JSON.stringify([...all]));
  } catch {
    // best-effort; a re-login may re-upload a strip if storage is unavailable
  }
}

async function uploadStrip(rec: StripRecord): Promise<boolean> {
  const form = new FormData();
  form.set("image", rec.image, `${rec.id}.jpg`);
  form.set("booth_id", rec.boothId);
  form.set("caption", rec.caption ?? "");
  form.set("date_text", rec.dateText ?? "");
  form.set("serial", rec.serial ?? "");
  // No `finish`: StripRecord doesn't track it locally (the chosen finish is
  // already baked into the composited image pixels) — the server defaults
  // the column to 'gloss', which only affects metadata/filtering, not the
  // uploaded image itself.
  const res = await fetch("/api/strips", { method: "POST", body: form });
  return res.ok;
}

export async function migrateGuestStrips(): Promise<{
  uploaded: number;
  failed: number;
}> {
  let uploaded = 0;
  let failed = 0;

  let strips: StripRecord[];
  try {
    strips = await listStrips();
  } catch {
    return { uploaded, failed }; // IndexedDB unavailable — nothing to migrate
  }

  const done = migratedIds();
  const pending = strips.filter((s) => !done.has(s.id));
  const newlyMigrated: string[] = [];

  for (const rec of pending) {
    try {
      if (await uploadStrip(rec)) {
        uploaded++;
        newlyMigrated.push(rec.id);
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (newlyMigrated.length) markMigrated(newlyMigrated);
  return { uploaded, failed };
}

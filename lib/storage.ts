import type { StripRecord } from "./types";

const DB_NAME = "photobooth-passport";
const STORE = "strips";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const r = fn(t.objectStore(STORE));
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export async function saveStrip(rec: StripRecord): Promise<void> {
  await run("readwrite", (s) => s.put(rec));
}

export async function listStrips(): Promise<StripRecord[]> {
  const all = await run<StripRecord[]>("readonly", (s) => s.getAll());
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteStrip(id: string): Promise<void> {
  await run("readwrite", (s) => s.delete(id));
}

export async function getStrip(id: string): Promise<StripRecord | undefined> {
  return run<StripRecord | undefined>("readonly", (s) => s.get(id));
}

// Caches a strip's share slug/URL (from the first upload-on-share-intent,
// see lib/shareUpload.ts) onto its existing IndexedDB record, so a later
// share of the same strip reuses the slug instead of re-uploading. A no-op
// if the record can't be found (e.g. storage was unavailable at affix time)
// — the upload itself already succeeded, only the cache is skipped.
export async function updateStripShare(
  id: string,
  share: { slug: string; url: string },
): Promise<void> {
  const rec = await getStrip(id);
  if (!rec) return;
  await saveStrip({ ...rec, shareSlug: share.slug, shareUrl: share.url });
}

export function nextSerial(prefix: string): string {
  const key = "pb-serial-counter";
  let n = 1;
  try {
    n = (parseInt(localStorage.getItem(key) || "0", 10) || 0) + 1;
    localStorage.setItem(key, String(n));
  } catch {
    n = Math.floor(Math.random() * 9000) + 1000;
  }
  const yy = String(new Date().getFullYear()).slice(2);
  return `${prefix}-${yy}-${String(n).padStart(4, "0")}`;
}

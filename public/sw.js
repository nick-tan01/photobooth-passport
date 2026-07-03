const CACHE = "pp-v3";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(["/"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // /admin (the authenticated Bureau Ledger) is never SW-handled at all —
  // neither intercepted nor cached — by either the navigation or asset
  // branch below, regardless of request mode.
  if (url.pathname.startsWith("/admin")) return;

  // navigations: network first, fall back to the cached shell offline.
  // Only "/" itself is ever written under the shell cache key, and every
  // other navigation (e.g. /s/[slug]) is a network passthrough with no
  // cache write, so an offline reload always serves the camera shell,
  // never a leaked or stale authenticated/share page.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (url.pathname === "/") {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return r;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // static assets + fonts: cache first
  const cacheable =
    e.request.method === "GET" &&
    (url.origin === location.origin ||
      url.hostname.endsWith("gstatic.com") ||
      url.hostname.endsWith("googleapis.com"));
  if (!cacheable) return;

  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request).then((r) => {
          if (r.ok) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return r;
        }),
    ),
  );
});

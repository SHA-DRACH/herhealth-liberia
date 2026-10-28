/* HerHealth service worker.
 * Caches: app shell, icons, static assets, pages the user chose to save, downloaded audio, Find Help.
 * Never caches: /api/ask (AI conversations), admin pages, or any other API response. */
const SHELL = "hh-shell-v1";
const CONTENT = "hh-content-v1"; // filled by "Save for offline reading"
const AUDIO = "hh-audio-v1"; // filled by "Save audio offline"
const PAGES = "hh-pages-v1";
const SHELL_URLS = ["/", "/learn", "/help", "/emergency", "/privacy", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL, CONTENT, AUDIO, PAGES];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/ask")) return;

  if (url.pathname.startsWith("/api/audio/")) {
    // Downloaded audio is served from cache; otherwise straight from the network (not cached automatically).
    event.respondWith(caches.match(req.url, { cacheName: AUDIO }).then((hit) => hit || fetch(req)));
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    // Network first; fall back to a saved copy when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && (url.pathname === "/" || url.pathname.startsWith("/learn") || url.pathname.startsWith("/help") || url.pathname === "/emergency")) {
            const copy = res.clone();
            caches.open(PAGES).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
    );
  }
});

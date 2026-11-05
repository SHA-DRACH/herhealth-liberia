/* HerHealth service worker — app-shell caching for low bandwidth (section 29).
   Never caches Ask HerHealth, the API or the admin, so sensitive content is not stored on the device. */
const VERSION = "hh-shell-v2";
const SCOPE = self.registration.scope;
const SHELL = ["", "learn", "listen", "help", "emergency", "privacy", "offline", "assets/css/app.css", "assets/js/app.js",
  "assets/vendor/aos.css", "assets/vendor/aos.js", "icon.svg", "manifest.webmanifest"].map((p) => new URL(p, SCOPE).href);

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("hh-shell-") && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const NEVER = /\/(ask|api|admin|welcome|language)(\/|$|\?)/;

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(SCOPE) || NEVER.test(new URL(req.url).pathname)) return;
  const isPage = req.mode === "navigate";
  if (isPage) {
    // Network first; fall back to the saved/cached copy, then the offline page.
    e.respondWith(fetch(req).then((res) => {
      if (res.ok && /\/article\//.test(req.url)) { const copy = res.clone(); caches.open("hh-runtime").then((c) => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req, { ignoreSearch: false })) || (await caches.match(new URL("offline", SCOPE).href))));
    return;
  }
  // Static assets only (never HTML or data): cache first.
  // Assets are versioned (?v=…), so an exact match is always current; when offline any cached copy is used.
  if (!/\.(css|js|svg|png|webp|webmanifest)$/.test(new URL(req.url).pathname)) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }))));
});

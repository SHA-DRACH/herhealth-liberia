// HerHealth static preview: the whole app is small, so it is cached on first visit and works offline.
// Questions typed into Ask HerHealth are never sent anywhere, so nothing sensitive is cached.
const CACHE = "hh-static-v5";
const FILES = ["./", "index.html", "css/styles.css", "js/app.js", "js/content.js", "js/safety.js", "js/safety-cases.js", "js/content-more.js", "vendor/aos.js", "vendor/aos.css", "icon.svg", "manifest.webmanifest"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) =>
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // Network first so updates appear immediately; cached copy when offline.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("index.html"))),
  );
});

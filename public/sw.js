// Service worker minimal : rend l'app installable et sert une coquille hors-ligne.
// Les données restent toujours réseau-d'abord (rien de périmé n'est affiché).

const CACHE = "amana-v1";
const SHELL = ["/", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Jamais de cache pour l'authentification, les API et les mutations.
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) return;

  // Réseau d'abord ; le cache ne sert que de filet hors-ligne.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? caches.match("/")))
  );
});

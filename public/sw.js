// Service worker minimal : rend l'app installable et sert une coquille hors-ligne.
// Les données restent toujours réseau-d'abord (rien de périmé n'est affiché).

const CACHE = "amana-v2";
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

// ─────────────────────── Les notifications poussees ───────────────────────
// Sans elles, tout ce qui est « in-app » suppose que la personne ouvre
// l'application — donc n'atteint jamais celle qui l'a oubliee.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titre: "AMANA", corps: event.data ? event.data.text() : "" };
  }

  const titre = data.titre || "AMANA";
  const options = {
    body: data.corps || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Un seul fil : une notification remplace la precedente au lieu de
    // s'empiler. Trois rappels non lus ne valent pas mieux qu'un.
    tag: data.fil || "amana",
    renotify: true,
    data: { href: data.href || "/aujourdhui" },
  };

  event.waitUntil(self.registration.showNotification(titre, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = (event.notification.data && event.notification.data.href) || "/aujourdhui";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      // Si l'app est deja ouverte, on la ramene au premier plan plutot que
      // d'en ouvrir une seconde.
      for (const f of fenetres) {
        if (f.url.includes(self.location.origin)) {
          f.navigate(cible);
          return f.focus();
        }
      }
      return self.clients.openWindow(cible);
    })
  );
});

/**
 * Multiplication Rocket Lab - Service Worker (sw.js)
 */
const CACHE_NAME = "rocket-lab-cache-v2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./test.html",
  "./css/style.css",
  "./css/animations.css",
  "./js/config.js",
  "./js/i18n.js",
  "./js/profiles.js",
  "./js/storage.js",
  "./js/achievements.js",
  "./js/missions.js",
  "./js/audio.js",
  "./js/math.js",
  "./js/rocket.js",
  "./js/launch.js",
  "./js/ui.js",
  "./js/game.js",
  "./js/main.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

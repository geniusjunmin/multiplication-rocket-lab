/**
 * Multiplication Rocket Lab - Service Worker (sw.js)
 * Version 4.1.0 — Offline-First PWA Cache
 */
const CACHE_NAME = "rocket-lab-cache-v4.1.0";
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
  "./js/progression.js",
  "./js/achievements.js",
  "./js/missions.js",
  "./js/audio.js",
  "./js/math.js",
  "./js/rocket.js",
  "./js/launch.js",
  "./js/ui.js",
  "./js/game.js",
  "./js/animlab.js",
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
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const resClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

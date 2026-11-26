"use strict";

var CACHE_PREFIX = "kromoak-static-";
var CACHE_NAME = CACHE_PREFIX + "v1";

var STATIC_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/css/app.css",
  "/js/config.js",
  "/js/api.js",
  "/js/collection.js",
  "/js/keypad.js",
  "/js/modal.js",
  "/js/app.js",
  "/js/pwa.js",
  "/apple-touch-icon.png",
  "/apple-touch-icon-152x152.png",
  "/apple-touch-icon-precomposed.png",
  "/img/icons/icon-192.png",
  "/img/icons/icon-512.png"
];

/**
 * Precache the static application files.
 */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      var requests = STATIC_FILES.map(function (path) {
        return new Request(path, {
          cache: "reload"
        });
      });

      return cache.addAll(requests);
    })
  );
});

/**
 * Remove obsolete Kromoak caches when activating
 * a new service worker version.
 */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
              return caches.delete(key);
            }

            return Promise.resolve();
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

/**
 * Retrieve a static resource from the network and update
 * its cached copy. Fall back to the cache if the network
 * is unavailable.
 *
 * @param {Request} request Resource request.
 * @return {Promise} Resource response.
 */
function networkFirst(request) {
  return fetch(request, {
    cache: "no-cache"
  })
    .then(function (response) {
      var copy;

      if (!response.ok || response.redirected) {
        return response;
      }

      copy = response.clone();

      return caches
        .open(CACHE_NAME)
        .then(function (cache) {
          return cache.put(request, copy);
        })
        .then(function () {
          return response;
        })
        .catch(function () {
          return response;
        });
    })
    .catch(function (error) {
      return caches
        .open(CACHE_NAME)
        .then(function (cache) {
          return cache.match(request);
        })
        .then(function (cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }

          throw error;
        });
    });
}

/**
 * Intercept only known static frontend resources.
 * API requests and card images are never cached.
 */
self.addEventListener("fetch", function (event) {
  var request = event.request;
  var url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.search !== "" || STATIC_FILES.indexOf(url.pathname) === -1) {
    return;
  }

  event.respondWith(networkFirst(request));
});

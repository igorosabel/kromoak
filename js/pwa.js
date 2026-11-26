(function () {
  "use strict";

  /**
   * Register the service worker when supported
   * by the current browser.
   *
   * Older browsers continue working without it.
   */
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(function (error) {
      if (window.console && window.console.warn) {
        window.console.warn(
          "Kromoak service worker registration failed.",
          error
        );
      }
    });
  }

  window.addEventListener("load", registerServiceWorker, false);
})();

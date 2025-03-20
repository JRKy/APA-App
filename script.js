if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((registration) => {
    console.log("Service Worker registered with scope:", registration.scope);

    // Listen for service worker updates
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("New version available. Refresh to update.");
        }
      };
    };
  }).catch((error) => {
    console.error("Service Worker registration failed:", error);
  });
}

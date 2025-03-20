if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.1.5").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Ensure new updates apply immediately without user prompts
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("New version detected. Updating silently...");
                    installingWorker.postMessage({ action: "skipWaiting" });
                }
            };
        };
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });

    // Reload when a new service worker takes control (without user interaction)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
    });
}

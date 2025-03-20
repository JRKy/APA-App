if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.1.7").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Listen for new service worker installations
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                    console.log("New version detected. It will be applied on next reload.");
                }
            };
        };
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });
}

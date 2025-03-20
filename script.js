if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/APA-App/sw.js").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Listen for updates
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    console.log("New version detected. Refreshing...");
                    if (confirm("A new version is available. Reload now?")) {
                        window.location.reload();
                    }
                }
            };
        };
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });

    // Ensure immediate update
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
    });
}

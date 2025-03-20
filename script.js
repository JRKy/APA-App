if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.1.6").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Ensure new updates apply without looping
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

    // Prevent infinite reload loops
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        const lastReload = localStorage.getItem("lastSWUpdate");
        const now = Date.now();

        if (!lastReload || now - lastReload > 5000) { // 5 seconds between reloads
            console.log("Reloading page for new service worker...");
            localStorage.setItem("lastSWUpdate", now);
            window.location.reload();
        } else {
            console.log("Preventing infinite reload loop.");
        }
    });
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.1.3").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        // Get stored version
        const storedVersion = localStorage.getItem("APA_App_Version");
        const currentVersion = "1.1.3";

        // Listen for service worker updates
        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            installingWorker.onstatechange = () => {
                if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller &&
                    storedVersion !== currentVersion
                ) {
                    console.log("New version detected.");
                    localStorage.setItem("APA_App_Version", currentVersion);

                    if (confirm("A new version is available. Reload now?")) {
                        window.location.reload();
                    }
                }
            };
        };
    }).catch((error) => {
        console.error("Service Worker registration failed:", error);
    });

    // Ensure immediate update but prevent infinite loops
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        const storedVersion = localStorage.getItem("APA_App_Version");
        const currentVersion = "1.1.3";

        if (storedVersion !== currentVersion) {
            window.location.reload();
        }
    });
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js?v=1.1.4").then((registration) => {
        console.log("Service Worker registered with scope:", registration.scope);

        const storedVersion = localStorage.getItem("APA_App_Version");
        const currentVersion = "1.1.4";
        const isDevelopment = window.location.hostname === "localhost"; // Detects local development

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

                    if (isDevelopment) {
                        // Show prompt in development mode
                        if (confirm("A new version is available. Reload now?")) {
                            window.location.reload();
                        }
                    } else {
                        // Silent update in production
                        console.log("New version loaded in the background.");
                        installingWorker.postMessage({ action: "skipWaiting" });
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
        const currentVersion = "1.1.4";

        if (storedVersion !== currentVersion) {
            window.location.reload();
        }
    });
}

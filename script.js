<script>
$(function () {
    const panel = $("#apa-panel");

    function savePanelState() {
        const offset = panel.offset();
        const width = panel.width();
        const height = panel.height();
        localStorage.setItem("apaPanelState", JSON.stringify({
            left: offset.left,
            top: offset.top,
            width,
            height
        }));
    }

    function loadPanelState() {
        const saved = JSON.parse(localStorage.getItem("apaPanelState"));
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (saved) {
            const left = Math.min(saved.left, viewportWidth - 100);
            const top = Math.min(saved.top, viewportHeight - 100);
            const width = saved.width;
            const height = saved.height;

            const isOffscreen = left + width < 0 || top + height < 0 || left > viewportWidth || top > viewportHeight;

            if (!isOffscreen) {
                panel.css({ left, top, width, height });
                panel.removeClass("hidden");
                $("#toggle-apa-btn").text("Hide APA Table");
                return;
            }
        }

        // Fallback to default
        panel.css({ left: "", top: "", width: "", height: "" });
        panel.removeClass("hidden");
        $("#toggle-apa-btn").text("Hide APA Table");
    }

    function resetPanelState() {
        localStorage.removeItem("apaPanelState");
        panel.css({ left: "", top: "", width: "", height: "" });
        panel.removeClass("hidden");
        $("#toggle-apa-btn").text("Hide APA Table");
    }

    panel.draggable({
        handle: ".apa-panel-header",
        containment: "body",
        snap: true,
        snapMode: "both",
        snapTolerance: 20,
        stop: savePanelState
    }).resizable({ stop: savePanelState });

    $("#close-apa-panel").on("click", function () {
        panel.addClass("hidden");
        $("#toggle-apa-btn").text("Show APA Table");
    });

    $("#reset-apa-panel").on("click", function () {
        resetPanelState();
    });

    $("#toggle-apa-btn").on("click", function () {
        panel.toggleClass("hidden");
        const isVisible = !panel.hasClass("hidden");
        $(this).text(isVisible ? "Hide APA Table" : "Show APA Table");
    });

    loadPanelState();
});
</script>

let map;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing APA App...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  L.Control.APA = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-control apa-control");

      container.innerHTML = `
        <div class="apa-panel-header">
          <h4 style="margin:0;">APA Table</h4>
          <span style="margin-left:auto;">
            <button id="reposition-apa" title="Reset Position">↺</button>
            <button id="toggle-apa-collapse" title="Collapse">−</button>
          </span>
        </div>
        <div id="apa-table-wrapper">
          <table id="apa-table">
            <thead>
              <tr>
                <th>Show</th>
                <th>Satellite</th>
                <th>Lon (°)</th>
                <th>El (°)</th>
                <th>Az (°)</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;

      const saved = JSON.parse(localStorage.getItem("apaState"));
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const panelW = 360;
      const panelH = 300;

      let left = 80;
      let top = 80;

      if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
        const fitsX = saved.left >= 0 && saved.left + panelW <= viewportW;
        const fitsY = saved.top >= 0 && saved.top + panelH <= viewportH;

        if (fitsX && fitsY) {
          left = saved.left;
          top = saved.top;
        } else {
          console.warn("Saved APA panel position was offscreen. Resetting to default.");
        }
      }

      // Apply corrected positioning style manually
      Object.assign(container.style, {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 9999
      });

      console.log(`APA panel injected at left: ${left}, top: ${top}`);

      if (saved?.collapsed) {
        const wrapper = container.querySelector("#apa-table-wrapper");
        const toggleBtn = container.querySelector("#toggle-apa-collapse");
        wrapper.style.display = "none";
        toggleBtn.textContent = "+";
        console.log("APA panel loaded in collapsed state");
      }

      $(container).draggable({
        handle: ".apa-panel-header",
        stop: function (_, ui) {
          saveState(ui.position.left, ui.position.top);
        }
      });

      return container;
    }
  });

  function saveState(left, top) {
    const isCollapsed = document.getElementById("apa-table-wrapper")?.style.display === "none";
    localStorage.setItem("apaState", JSON.stringify({
      left,
      top,
      collapsed: isCollapsed
    }));
    console.log(`APA panel state saved: left=${left}, top=${top}, collapsed=${isCollapsed}`);
  }

  const apaControl = new L.Control.APA({ position: "topright" });
  map.addControl(apaControl);

  document.addEventListener("click", (e) => {
    const wrapper = document.getElementById("apa-table-wrapper");
    const btn = e.target;

    if (btn.id === "toggle-apa-collapse") {
      const isCollapsed = wrapper.style.display === "none";
      wrapper.style.display = isCollapsed ? "block" : "none";
      btn.textContent = isCollapsed ? "−" : "+";
      const container = btn.closest(".apa-control");
      saveState(parseInt(container.style.left), parseInt(container.style.top));
    }

    if (btn.id === "reposition-apa") {
      localStorage.removeItem("apaState");
      location.reload();
    }
  });
});
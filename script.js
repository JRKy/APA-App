let map;

document.addEventListener("DOMContentLoaded", () => {
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

      // Restore state
      const saved = JSON.parse(localStorage.getItem("apaState"));
      if (saved) {
        if (saved.left && saved.top) {
          container.style.left = saved.left + "px";
          container.style.top = saved.top + "px";
        }
        if (saved.collapsed) {
          container.querySelector("#apa-table-wrapper").style.display = "none";
          container.querySelector("#toggle-apa-collapse").textContent = "+";
        }
      } else {
        container.style.top = "80px";
        container.style.left = "80px";
      }

      $(container).draggable({
        handle: ".apa-panel-header",
        stop: function (event, ui) {
          const pos = ui.position;
          saveState(pos.left, pos.top);
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
      saveState(
        parseInt(btn.closest(".apa-control").style.left),
        parseInt(btn.closest(".apa-control").style.top)
      );
    }

    if (btn.id === "reposition-apa") {
      localStorage.removeItem("apaState");
      location.reload();
    }
  });
});

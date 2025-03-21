let map;

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Custom APA Leaflet Control
  L.Control.APA = L.Control.extend({
    onAdd: function () {
      const container = L.DomUtil.create("div", "leaflet-control apa-control");

      container.innerHTML = `
        <div class="apa-panel-header">
          <h4 style="margin:0;">APA Table</h4>
          <button id="toggle-apa-collapse" title="Collapse">−</button>
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

      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  map.addControl(new L.Control.APA({ position: "topright" }));

  // Collapse button behavior
  document.addEventListener("click", (e) => {
    if (e.target.id === "toggle-apa-collapse") {
      const tableWrapper = document.getElementById("apa-table-wrapper");
      const btn = e.target;
      const collapsed = tableWrapper.style.display === "none";
      tableWrapper.style.display = collapsed ? "block" : "none";
      btn.textContent = collapsed ? "−" : "+";
      btn.title = collapsed ? "Collapse" : "Expand";
    }
  });

  // Load locations into map later here (optional)
});

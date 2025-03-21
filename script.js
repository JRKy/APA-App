let map;
let apaControl;
const positions = ["topright", "topleft", "bottomleft", "bottomright"];
let currentPositionIndex = 0;

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
            <button id="reposition-apa" title="Move APA Panel">⇄</button>
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

      L.DomEvent.disableClickPropagation(container);
      return container;
    }
  });

  // Initial control add
  apaControl = new L.Control.APA({ position: positions[currentPositionIndex] });
  map.addControl(apaControl);

  // Event delegation
  document.addEventListener("click", (e) => {
    if (e.target.id === "toggle-apa-collapse") {
      const wrapper = document.getElementById("apa-table-wrapper");
      const btn = e.target;
      const isCollapsed = wrapper.style.display === "none";
      wrapper.style.display = isCollapsed ? "block" : "none";
      btn.textContent = isCollapsed ? "−" : "+";
      btn.title = isCollapsed ? "Collapse" : "Expand";
    }

    if (e.target.id === "reposition-apa") {
      map.removeControl(apaControl);
      currentPositionIndex = (currentPositionIndex + 1) % positions.length;
      apaControl = new L.Control.APA({ position: positions[currentPositionIndex] });
      map.addControl(apaControl);
      console.log(`APA panel moved to ${positions[currentPositionIndex]}`);
    }
  });

  // Optional: load satellite/location data here later
});

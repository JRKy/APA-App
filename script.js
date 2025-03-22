let map;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing APA App...");

  map = L.map("map").setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Create APA panel as Leaflet control
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

      // Collapse toggle
      container.querySelector("#toggle-apa-collapse").addEventListener("click", () => {
        const wrapper = container.querySelector("#apa-table-wrapper");
        const btn = container.querySelector("#toggle-apa-collapse");
        const isCollapsed = wrapper.style.display === "none";
        wrapper.style.display = isCollapsed ? "block" : "none";
        btn.textContent = isCollapsed ? "−" : "+";
      });

      return container;
    }
  });

  // Add to map
  const apaControl = new L.Control.APA({ position: "topright" });
  map.addControl(apaControl);

  // Mock: Populate table (for now)
  const tbody = document.querySelector("#apa-table tbody");
  const sats = [
    { name: "SAT-A", lon: 10, el: 25, az: 135 },
    { name: "SAT-B", lon: 45, el: -5, az: 160 },
    { name: "SAT-C", lon: 90, el: 40, az: 100 }
  ];

  sats.forEach(sat => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" checked></td>
      <td>${sat.name}</td>
      <td>${sat.lon}</td>
      <td class="${sat.el < 0 ? "negative" : ""}">${sat.el}</td>
      <td>${sat.az}</td>
    `;
    tbody.appendChild(row);
  });
});

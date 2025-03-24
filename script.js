// APA App Script - v1.7.15

console.log("APA App v1.7.15 Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const locBtn = document.getElementById("toggle-location-drawer");
  const satBtn = document.getElementById("toggle-satellite-drawer");
  const locDrawer = document.getElementById("location-drawer");
  const satDrawer = document.getElementById("satellite-drawer");

  function toggleDrawer(drawer, others) {
    const isOpen = drawer.classList.contains("visible");
    drawer.classList.toggle("visible", !isOpen);
    others.forEach(d => d.classList.remove("visible"));
  }

  locBtn.addEventListener("click", () =>
    toggleDrawer(locDrawer, [satDrawer])
  );

  satBtn.addEventListener("click", () =>
    toggleDrawer(satDrawer, [locDrawer])
  );

  document.getElementById("custom-location-btn").addEventListener("click", () => {
    const lat = parseFloat(document.getElementById("custom-lat").value);
    const lon = parseFloat(document.getElementById("custom-lon").value);
    if (!isNaN(lat) && !isNaN(lon)) {
      alert(`Moving to location: ${lat}, ${lon}`);
      locDrawer.classList.remove("visible");
    }
  });

  document.getElementById("add-satellite-btn").addEventListener("click", () => {
    const name = document.getElementById("sat-name").value.trim();
    const lon = parseFloat(document.getElementById("sat-lon").value);
    if (name && !isNaN(lon)) {
      alert(`Adding satellite: ${name} @ ${lon}`);
      satDrawer.classList.remove("visible");
    }
  });
});
/* APA App Styles - v1.3.1 */

body, html {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

header {
  background-color: #003087;
  color: white;
  padding: 15px;
  text-align: center;
}

#map {
  height: calc(100vh - 100px);
  width: 100%;
  position: relative;
}

/* Map Control Box */
.map-controls {
  position: absolute;
  top: 10px;
  left: 50px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.map-controls select,
.map-controls button {
  padding: 6px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
}

/* APA Floating Panel */
.apa-floating {
  position: absolute;
  background-color: rgba(0, 48, 135, 0.95);
  color: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  overflow-y: auto;
  z-index: 1001;
}

.apa-floating.hidden {
  display: none !important;
}

.apa-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#close-apa-panel {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
}

/* APA Table */
#apa-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 10px;
}

#apa-table th,
#apa-table td {
  border: 1px solid white;
  padding: 6px;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-size: 13px;
}

#apa-table th {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.negative {
  color: #FF5252;
  font-weight: bold;
}

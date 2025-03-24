/* APA App Styles - v1.6.9.8 */

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
  padding: 8px 15px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  height: 40px;
}

header h1 {
  margin: 0;
  font-size: 16px;
}

#map {
  height: calc(100vh - 40px);
  width: 100%;
  position: relative;
}

.map-tools {
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.map-tools button {
  background: white;
  border: 1px solid #ccc;
  padding: 6px;
  width: 34px;
  height: 34px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.map-tools button:hover {
  background-color: #eee;
}

.tool-panel {
  position: absolute;
  top: 60px;
  left: 60px;
  background: white;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.25);
  z-index: 1002;
  font-size: 13px;
  display: none;
  width: 260px;
  max-height: 70vh;
  overflow-y: auto;
}

.tool-panel fieldset {
  margin-bottom: 10px;
  border: 1px solid #ccc;
  padding: 6px;
  border-radius: 4px;
}

.tool-panel legend {
  font-weight: bold;
  font-size: 12px;
  padding: 0 4px;
}

.tool-panel label {
  display: block;
  font-weight: bold;
  margin-top: 6px;
}

.tool-panel input,
.tool-panel select,
.tool-panel button {
  width: 100%;
  padding: 6px;
  font-size: 13px;
  margin-top: 2px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

#apa-panel.leaflet-control.apa-control {
  background: rgba(0, 48, 135, 0.96);
  color: white;
  padding: 10px;
  border-radius: 6px;
  max-height: 60vh;
  max-width: 320px;
  overflow-y: auto;
  z-index: 1001;
  position: absolute;
  top: 60px;
  right: 20px;
  display: none;
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

#apa-table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
  table-layout: fixed;
}

#apa-table th,
#apa-table td {
  border: 1px solid white;
  padding: 4px;
  text-align: center;
  word-wrap: break-word;
  font-size: 13px;
}

#apa-table th {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.negative {
  color: #ff5252;
  font-weight: bold;
}

.apa-line-label {
  background: none !important;
  color: #000;
  font-weight: bold;
  text-shadow: 1px 1px 2px #fff;
}

#help-tooltip {
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: #003087;
  color: white;
  padding: 8px 12px;
  border-radius: 5px;
  font-size: 13px;
  z-index: 9999;
  max-width: 300px;
}

#help-tooltip.hidden {
  display: none !important;
}

#show-apa-btn {
  position: fixed;
  right: 20px;
  bottom: 10px;
  z-index: 1002;
  padding: 8px 12px;
  background: #003087;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 13px;
  display: none;
  cursor: pointer;
}

// data.js
import { VERSION } from './js/modules/core/version.js';

const SATELLITES = [
  { name: "MUOS-2", longitude: -177 },
  { name: "MUOS-5", longitude: -100 },
  { name: "MUOS-3", longitude: -15.5 },
  { name: "MUOS-4", longitude: 75 },
  { name: "ALT-1", longitude: -127 },
  { name: "ALT-2", longitude: -24 },
  { name: "ALT-3", longitude: 110 },
  { name: "ALT-4", longitude: 100 },
  { name: "ALT-5", longitude: 170 }
];

const LOCATIONS = [
  { name: "NSA Bahrain", latitude: 26.2076027857257, longitude: 50.6111061537939, country: "Bahrain", aor: "CENTCOM" },
  { name: "Camp Arifjan", latitude: 28.88745959804, longitude: 48.1699731354169, country: "Kuwait", aor: "CENTCOM" },
  { name: "Al Udeid AB", latitude: 25.1235678538811, longitude: 51.3374629203215, country: "Qatar", aor: "CENTCOM" },
  { name: "MacDill AFB, FL", latitude: 27.8510433301987, longitude: -82.5090662423147, country: "USA", aor: "CENTCOM" },
  { name: "Ramstein AB", latitude: 49.4401704826424, longitude: 7.59720948275646, country: "Germany", aor: "EUCOM" },
  { name: "Clay Kaserne", latitude: 50.0407041208674, longitude: 8.32711774313159, country: "Germany", aor: "EUCOM" },
  { name: "Panzer Kaserne", latitude: 48.6858355365503, longitude: 9.04351944045798, country: "Germany", aor: "EUCOM" },
  { name: "Patch Barracks", latitude: 48.7359556828308, longitude: 9.08381048452004, country: "Germany", aor: "EUCOM" },
  { name: "Kelley Barracks", latitude: 48.7219919385823, longitude: 9.18093129807744, country: "Germany", aor: "EUCOM" },
  { name: "Yokota AB", latitude: 35.7376122917397, longitude: 139.343845833246, country: "Japan", aor: "INDOPACOM" },
  { name: "Camp Zama", latitude: 35.4897327860585, longitude: 139.395765984187, country: "Japan", aor: "INDOPACOM" },
  { name: "CP Tango", latitude: 37.5168786865521, longitude: 126.983267811205, country: "South Korea", aor: "INDOPACOM" },
  { name: "Camp Humphreys", latitude: 36.9663892737021, longitude: 127.009713317196, country: "South Korea", aor: "INDOPACOM" },
  { name: "Osan AB", latitude: 37.0831716293535, longitude: 127.034182452515, country: "South Korea", aor: "INDOPACOM" },
  { name: "Busan", latitude: 35.1641114151272, longitude: 129.055238532993, country: "South Korea", aor: "INDOPACOM" },
  { name: "Camp Smith, HI", latitude: 21.3854942009106, longitude: -157.907935527315, country: "USA", aor: "INDOPACOM" },
  { name: "CMSFS, CO", latitude: 38.859055, longitude: -104.813499, country: "USA", aor: "NORTHCOM" },
  { name: "Peterson SFB, CO", latitude: 38.0, longitude: -104.0, country: "USA", aor: "NORTHCOM" },
  { name: "Omaha AFB, NE", latitude: 41.1183, longitude: -95.9052, country: "USA", aor: "NORTHCOM" },
  { name: "RRMC, PA", latitude: 36.233402, longitude: -91.251801, country: "USA", aor: "NORTHCOM" },
  { name: "Schriever SFB, CO", latitude: 38.801244686130765, longitude: -104.5260869617432, country: "USA", aor: "NORTHCOM" }
];

console.log(`Data Loaded: ${SATELLITES.length} satellites, ${LOCATIONS.length} locations (${VERSION})`);

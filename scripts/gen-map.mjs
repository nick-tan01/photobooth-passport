// Generates lib/mapdata.ts: a real North America outline (Albers conic
// projection of public-domain country outlines), real lake markers, real
// graticule lines, and projected booth pin coordinates.
// Run: node scripts/gen-map.mjs
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const COUNTRIES = ["USA", "CAN", "MEX"];
const SRC = (c) =>
  `https://raw.githubusercontent.com/johan/world.geo.json/master/countries/${c}.geo.json`;

const VB_W = 390;
const VB_H = 300;
const PAD = 14;

// Albers equal-area conic, tuned for North America
const d2r = Math.PI / 180;
const phi1 = 20 * d2r;
const phi2 = 60 * d2r;
const phi0 = 42 * d2r;
const lam0 = -96 * d2r;
const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
const C = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
const rho = (phi) => Math.sqrt(C - 2 * n * Math.sin(phi)) / n;
const rho0 = rho(phi0);

function project(lng, lat) {
  const lam = lng * d2r;
  const phi = lat * d2r;
  const theta = n * (lam - lam0);
  return [rho(phi) * Math.sin(theta), rho0 - rho(phi) * Math.cos(theta)];
}

function ringBox(ring) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(a / 2);
}

function simplify(ring, tol) {
  const out = [ring[0]];
  for (let i = 1; i < ring.length - 1; i++) {
    const [px, py] = out[out.length - 1];
    const [x, y] = ring[i];
    if (Math.hypot(x - px, y - py) >= tol) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]);
  return out;
}

const rings = [];
for (const c of COUNTRIES) {
  const res = await fetch(SRC(c));
  if (!res.ok) throw new Error(`fetch ${c}: ${res.status}`);
  const gj = await res.json();
  for (const f of gj.features) {
    const g = f.geometry;
    const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      const outer = poly[0];
      // geographic filters: continental NA only
      const lngs = outer.map((p) => p[0]);
      const lats = outer.map((p) => p[1]);
      const cLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      const cLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      if (cLng > -52 || cLng < -170) continue; // antimeridian Aleutians, far east
      if (cLat < 14 || cLat > 75) continue; // tropics + far-arctic islands
      if (cLat < 25 && cLng < -150) continue; // Hawaii
      rings.push(outer.map(([lng, lat]) => project(lng, lat)));
    }
  }
}

// keep the biggest landmasses only
rings.sort((a, b) => ringArea(b) - ringArea(a));
const kept = rings.slice(0, 8);

// fit to viewBox
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const r of kept) {
  const b = ringBox(r);
  minX = Math.min(minX, b.minX);
  minY = Math.min(minY, b.minY);
  maxX = Math.max(maxX, b.maxX);
  maxY = Math.max(maxY, b.maxY);
}
const scale = Math.min((VB_W - PAD * 2) / (maxX - minX), (VB_H - PAD * 2) / (maxY - minY));
const ox = (VB_W - (maxX - minX) * scale) / 2;
const oy = (VB_H - (maxY - minY) * scale) / 2;
const toSvg = ([x, y]) => [
  +(ox + (x - minX) * scale).toFixed(1),
  +(oy + (maxY - y) * scale).toFixed(1),
];

const TOL = 2.2 / scale; // ~2.2 svg px simplification
const paths = kept.map((r) => {
  const pts = simplify(r, TOL).map(toSvg);
  return "M " + pts.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";
});

// graticule: real parallels + meridians through the projection
const lines = [];
for (const lat of [25, 40, 55, 70]) {
  const pts = [];
  for (let lng = -168; lng <= -52; lng += 3) pts.push(toSvg(project(lng, lat)));
  lines.push("M " + pts.map(([x, y]) => `${x} ${y}`).join(" L "));
}
for (const lng of [-130, -100, -70]) {
  const pts = [];
  for (let lat = 16; lat <= 74; lat += 3) pts.push(toSvg(project(lng, lat)));
  lines.push("M " + pts.map(([x, y]) => `${x} ${y}`).join(" L "));
}

// real lakes as small markers
const LAKE_DEFS = [
  { name: "Superior", lat: 47.7, lng: -87.5, rx: 7, ry: 3, rot: -22 },
  { name: "Michigan", lat: 43.9, lng: -87.0, rx: 2.6, ry: 5, rot: 8 },
  { name: "Huron", lat: 44.8, lng: -82.4, rx: 3.6, ry: 3.4, rot: 0 },
  { name: "Erie", lat: 42.2, lng: -81.2, rx: 4, ry: 1.6, rot: -28 },
  { name: "Ontario", lat: 43.7, lng: -77.9, rx: 3, ry: 1.3, rot: -18 },
];
const lakes = LAKE_DEFS.map((l) => {
  const [cx, cy] = toSvg(project(l.lng, l.lat));
  return { cx, cy, rx: l.rx, ry: l.ry, rot: l.rot };
});

// booth pins at true coordinates
const PIN_DEFS = {
  standard: { lat: 43.65, lng: -79.38 }, // Toronto
  midnight: { lat: 49.9, lng: -97.14 }, // mid-route, Winnipeg
  seaside: { lat: 34.01, lng: -118.49 }, // Santa Monica
  montreal: { lat: 45.5, lng: -73.57 },
  niagara: { lat: 43.08, lng: -79.08 },
};
const pins = {};
for (const [id, { lat, lng }] of Object.entries(PIN_DEFS)) {
  const [x, y] = toSvg(project(lng, lat));
  pins[id] = { x, y };
}

const out = `// Generated by scripts/gen-map.mjs — do not edit by hand.
// Real North America coastline (Albers conic), public-domain outlines.
export const MAP_W = ${VB_W};
export const MAP_H = ${VB_H};

export const LAND: string[] = ${JSON.stringify(paths)};

export const GRATICULE: string[] = ${JSON.stringify(lines)};

export const LAKES: { cx: number; cy: number; rx: number; ry: number; rot: number }[] = ${JSON.stringify(lakes)};

// true projected booth locations
export const TRUE_PIN: Record<string, { x: number; y: number }> = ${JSON.stringify(pins, null, 2)};
`;

await writeFile(
  fileURLToPath(new URL("../lib/mapdata.ts", import.meta.url)),
  out,
);
console.log("pins:", JSON.stringify(pins));
console.log(
  "path points:",
  paths.reduce((a, p) => a + p.split(" L ").length, 0),
);

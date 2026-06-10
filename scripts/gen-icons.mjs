// Generates PWA icons: a gold company seal on a navy field.
// Run: node scripts/gen-icons.mjs  (requires devDependency "sharp")
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const GOLD = "#C9A86A";
const NAVY = "#1F3A5F";

// camera glyph matches lib/stamp.ts "standard" booth glyph
const seal = (inset) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${NAVY}"/>
  <g transform="translate(256 256) scale(${inset})" stroke="${GOLD}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle r="200" stroke-width="14"/>
    <circle r="150" stroke-width="6"/>
    <g transform="scale(5.2)" >
      <path d="M -16 -5 H 16 V 13 H -16 Z" stroke-width="2.6"/>
      <path d="M 0 4 m 8.5 0 a 8.5 8.5 0 1 1 -17 0 a 8.5 8.5 0 1 1 17 0" stroke-width="2.6"/>
      <path d="M 0 4 m 3.5 0 a 3.5 3.5 0 1 1 -7 0 a 3.5 3.5 0 1 1 7 0" stroke-width="2"/>
      <path d="M -7 -11 H 7 V -5" stroke-width="2.4"/>
    </g>
    <circle r="178" stroke-width="0" fill="none"/>
  </g>
</svg>`;

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

await mkdir(fileURLToPath(new URL("../public", import.meta.url)), {
  recursive: true,
});

const full = Buffer.from(seal(1.0));
const safe = Buffer.from(seal(0.78)); // maskable: keep art inside the safe zone

await sharp(full).resize(192, 192).png().toFile(out("icon-192.png"));
await sharp(full).resize(512, 512).png().toFile(out("icon-512.png"));
await sharp(safe).resize(512, 512).png().toFile(out("maskable-512.png"));
await sharp(full).resize(180, 180).png().toFile(out("apple-touch-icon.png"));

console.log("icons written: icon-192, icon-512, maskable-512, apple-touch-icon");

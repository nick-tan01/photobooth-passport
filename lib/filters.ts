// Print finishes, named like a photo lab's options and grounded in real
// booth output: SILVER is the dip-and-dunk silver-halide look of the
// chemical booths (Auto-Photo Model 11 lineage), PEARL is the bright
// editorial B&W favoured by Korean booths (Photogray et al.), GOLD is
// the warm 1970s colour of the "C"-model booths and disposable film.
// One finish per sitting, chosen on the Sitting Card — like the real
// COLOUR / B&W switch on a booth fascia.

export type FinishId = "gloss" | "silver" | "pearl" | "gold";

export interface Finish {
  id: FinishId;
  name: string;
  blurb: string;
  // CSS approximation for the live viewfinder; the real look is the
  // pixel pipeline below, baked in at capture time.
  css: string;
}

export const FINISHES: Finish[] = [
  {
    id: "gloss",
    name: "GLOSS",
    blurb: "As shot. The honest print.",
    css: "sepia(0.06) saturate(1.05) contrast(1.02)",
  },
  {
    id: "silver",
    name: "SILVER",
    blurb: "Dip-and-dunk B&W. Deep blacks.",
    css: "grayscale(1) contrast(1.28) brightness(0.99)",
  },
  {
    id: "pearl",
    name: "PEARL",
    blurb: "Bright, soft black & white.",
    css: "grayscale(1) brightness(1.14) contrast(1.04)",
  },
  {
    id: "gold",
    name: "GOLD",
    blurb: "Warm 1970s colour.",
    css: "saturate(1.22) sepia(0.16) contrast(1.06) brightness(1.02)",
  },
];

export function getFinish(id: FinishId): Finish {
  return FINISHES.find((f) => f.id === id) ?? FINISHES[0];
}

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

// 256-entry tone curves, built once per finish.
function buildLut(fn: (v: number) => number): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) lut[i] = clamp(fn(i));
  return lut;
}

// SILVER: contrast around a low pivot, fogged floor, soft highlight bloom.
const SILVER_LUT = buildLut((v) => {
  let y = (v - 118) * 1.32 + 118;
  y = y + (255 - y) * 0.02; // bloom
  return Math.max(y, 16); // chemical fog — blacks never go fully dead
});

// PEARL: lifted exposure, gentle contrast, milky floor.
const PEARL_LUT = buildLut((v) => {
  let y = v * 1.1 + 16;
  y = (y - 132) * 1.05 + 132;
  return Math.max(y, 28);
});

// GOLD: gentle global contrast applied after the channel warm shift.
const GOLD_LUT = buildLut((v) => {
  let y = (v - 124) * 1.08 + 124;
  if (y < 40) y *= 0.92; // crush shadows slightly, like aged colour stock
  return y;
});

const GRAIN: Record<FinishId, number> = {
  gloss: 0,
  silver: 13,
  pearl: 7,
  gold: 6,
};

// Bakes the finish into a canvas that already holds the photo.
export function applyFinish(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  id: FinishId,
) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const grain = GRAIN[id];

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];

    if (id === "silver" || id === "pearl") {
      const lut = id === "silver" ? SILVER_LUT : PEARL_LUT;
      const y = lut[Math.round(r * 0.299 + g * 0.587 + b * 0.114)];
      r = g = b = y;
    } else if (id === "gold") {
      r = GOLD_LUT[clamp(Math.round(r * 1.1 + 8))];
      g = GOLD_LUT[clamp(Math.round(g * 1.02 + 2))];
      b = GOLD_LUT[clamp(Math.round(b * 0.9 - 6))];
    } else {
      // gloss: the faint warm print tone the strips have always had
      r = clamp(r + 5);
      b = clamp(b - 3);
    }

    if (grain) {
      const n = (Math.random() - 0.5) * 2 * grain;
      r = clamp(r + n);
      g = clamp(g + n);
      b = clamp(b + n);
    }

    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}

import type { Booth } from "./types";
import { drawBoothStamp, DISPLAY, GEO } from "./stamp";

const W = 720;
const M = 46;
const GAP = 26;
const HEADER = 108;
const FOOTER = 196;
const PHOTO = W - M * 2;
const H = HEADER + PHOTO * 4 + GAP * 3 + FOOTER;

export const STRIP_ASPECT = H / W;

export interface StripInput {
  photos: string[];
  booth: Booth;
  caption: string;
  dateText: string;
  serial: string;
}

export async function ensureFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(`16px ${GEO}`),
      document.fonts.load(`500 16px ${GEO}`),
      document.fonts.load(`600 16px ${GEO}`),
      document.fonts.load(`16px ${DISPLAY}`),
      document.fonts.load(`700 16px ${DISPLAY}`),
      document.fonts.load(`italic 600 16px ${DISPLAY}`),
    ]);
  } catch {
    // draw with fallbacks
  }
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

function rule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y: number,
  x2: number,
  color: string,
  width: number,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  tracking: number,
) {
  ctx.save();
  ctx.textAlign = "left";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let x = cx - total / 2;
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
  ctx.restore();
}

function paperNoise(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
) {
  const tile = document.createElement("canvas");
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext("2d")!;
  const img = tctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 226 + Math.floor(rand() * 29);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.4;
  for (let y = 0; y < h; y += 128) {
    for (let x = 0; x < w; x += 128) {
      ctx.drawImage(tile, x, y);
    }
  }
  ctx.restore();
}

export async function compositeStrip(input: StripInput): Promise<Blob> {
  await ensureFonts();
  const { photos, booth, caption, dateText, serial } = input;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  // seeded by serial: recompositing with a new caption keeps the same
  // misalignments, so the strip doesn't shuffle under the user
  const rand = mulberry32(hashCode(serial));

  ctx.fillStyle = booth.paper;
  ctx.fillRect(0, 0, W, H);
  paperNoise(ctx, W, H, rand);

  // header
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#1F3A5F";
  ctx.font = `600 17px ${GEO}`;
  drawTracked(ctx, "PHOTOBOOTH PASSPORT", W / 2, 44, 6);
  ctx.font = `700 24px ${DISPLAY}`;
  ctx.fillStyle = "#22262B";
  ctx.fillText(booth.name, W / 2, 80);
  rule(ctx, M, 92, W - M, "#C9A86A", 2.5);
  rule(ctx, M, 97, W - M, "rgba(31,58,95,0.35)", 1);

  // photos with slight misalignment, warm tone, vignette
  const imgs = await Promise.all(photos.map(loadImage));
  for (let i = 0; i < 4; i++) {
    const y = HEADER + i * (PHOTO + GAP);
    const rot = (rand() - 0.5) * 0.014;
    const dx = (rand() - 0.5) * 5;
    const dy = (rand() - 0.5) * 4;
    ctx.save();
    ctx.translate(W / 2 + dx, y + PHOTO / 2 + dy);
    ctx.rotate(rot);
    const half = PHOTO / 2;
    if (imgs[i]) ctx.drawImage(imgs[i], -half, -half, PHOTO, PHOTO);
    // photo toning now lives in the capture-time finish (lib/filters.ts);
    // the compositor only adds print character: vignette + frame
    const g = ctx.createRadialGradient(0, 0, PHOTO * 0.32, 0, 0, PHOTO * 0.74);
    g.addColorStop(0, "rgba(34,38,43,0)");
    g.addColorStop(1, "rgba(34,38,43,0.20)");
    ctx.fillStyle = g;
    ctx.fillRect(-half, -half, PHOTO, PHOTO);
    ctx.strokeStyle = "rgba(34,38,43,0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-half + 1, -half + 1, PHOTO - 2, PHOTO - 2);
    ctx.restore();
  }

  // footer: caption, date, serial, maker's mark, booth stamp
  const fy = HEADER + PHOTO * 4 + GAP * 3;
  ctx.textAlign = "center";
  if (caption.trim()) {
    ctx.fillStyle = "#1F3A5F";
    ctx.font = `italic 600 30px ${DISPLAY}`;
    ctx.fillText(caption, W / 2 - 24, fy + 60, W - M * 2 - 150);
  } else {
    rule(ctx, W / 2 - 170, fy + 58, W / 2 + 110, "rgba(34,38,43,0.3)", 1.5);
  }
  ctx.fillStyle = "#22262B";
  ctx.font = `500 16px ${GEO}`;
  drawTracked(ctx, `DATED ${dateText.toUpperCase()}`, W / 2 - 28, fy + 100, 2);

  ctx.font = `500 14px ${GEO}`;
  ctx.fillStyle = "rgba(34,38,43,0.78)";
  ctx.textAlign = "left";
  ctx.fillText(`No. ${serial}`, M, fy + 148);
  ctx.textAlign = "right";
  ctx.fillText("FOUR EXPOSURES", W - M, fy + 148);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(34,38,43,0.55)";
  ctx.font = `12px ${GEO}`;
  drawTracked(
    ctx,
    "ISSUED BY THE GRAND TOUR COMPANY · ONE AMENDMENT PERMITTED",
    W / 2,
    fy + 174,
    1,
  );

  drawBoothStamp(
    ctx,
    {
      color: booth.accent,
      top: booth.name.toUpperCase(),
      bottom: booth.stampLocale,
      glyph: booth.id,
    },
    W - M - 64,
    fy + 86,
    56,
    -0.2,
    0.8,
  );

  return new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("strip export failed"))),
      "image/jpeg",
      0.86,
    ),
  );
}

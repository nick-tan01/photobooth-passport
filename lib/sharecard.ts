import type { Booth } from "./types";
import { drawBoothStamp, DISPLAY, GEO } from "./stamp";
import { ensureFonts } from "./composite";

const W = 1080;
const H = 1920;
const NAVY = "#1F3A5F";
const GOLD = "#C9A86A";
const CREAM = "#F2ECDD";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
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

// A 9:16 story card: the strip affixed to the navy passport cover with
// photo corners, company lettering, and the booth seal in gold.
export async function composeShareCard(
  stripBlob: Blob,
  booth: Booth,
  serial: string,
  dateText: string,
): Promise<Blob> {
  await ensureFonts();
  const url = URL.createObjectURL(stripBlob);
  let img: HTMLImageElement;
  try {
    img = await loadImage(url);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  // double gold border, cover language
  ctx.strokeStyle = `${GOLD}B3`;
  ctx.lineWidth = 5;
  ctx.strokeRect(42, 42, W - 84, H - 84);
  ctx.strokeStyle = `${GOLD}59`;
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 64, W - 128, H - 128);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD;
  ctx.font = `600 40px ${GEO}`;
  drawTracked(ctx, "PHOTOBOOTH PASSPORT", W / 2, 160, 14);
  ctx.font = `500 22px ${GEO}`;
  ctx.fillStyle = `${GOLD}CC`;
  drawTracked(ctx, "THE GRAND TOUR COMPANY", W / 2, 206, 8);

  // strip with shadow + slight rotation
  const stripH = 1280;
  const stripW = stripH * (img.naturalWidth / img.naturalHeight);
  ctx.save();
  ctx.translate(W / 2, 300 + stripH / 2);
  ctx.rotate(-0.022);
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.drawImage(img, -stripW / 2, -stripH / 2, stripW, stripH);
  ctx.shadowColor = "transparent";
  // photo corners
  const half = { x: stripW / 2, y: stripH / 2 };
  ctx.fillStyle = "#DFD3B4";
  const corner = 44;
  const corners: [number, number, number][] = [
    [-half.x, -half.y, 0],
    [half.x, -half.y, Math.PI / 2],
    [half.x, half.y, Math.PI],
    [-half.x, half.y, -Math.PI / 2],
  ];
  for (const [x, y, rot] of corners) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(-14, -14);
    ctx.lineTo(corner, -14);
    ctx.lineTo(-14, corner);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // caption block
  ctx.fillStyle = CREAM;
  ctx.font = `italic 600 44px ${DISPLAY}`;
  ctx.fillText(booth.name, W / 2, 1700);
  ctx.fillStyle = `${GOLD}E6`;
  ctx.font = `500 26px ${GEO}`;
  drawTracked(ctx, `No. ${serial} · DATED ${dateText.toUpperCase()}`, W / 2, 1750, 4);

  drawBoothStamp(
    ctx,
    {
      color: GOLD,
      top: booth.name.toUpperCase(),
      bottom: booth.stampLocale,
      glyph: booth.glyph,
    },
    W - 170,
    1745,
    78,
    0.18,
    0.9,
  );

  return new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("share card export failed"))),
      "image/jpeg",
      0.9,
    ),
  );
}

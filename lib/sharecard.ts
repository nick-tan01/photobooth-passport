import type { Booth } from "./types";
import { drawBoothStamp, DISPLAY, GEO } from "./stamp";
import { ensureFonts } from "./composite";
import QRCode from "qrcode";

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

// Left-anchored variant of drawTracked, for the QR coupon's text block
// (DESIGN.md "Story-card additions" — that block is left-aligned against
// the QR chip, unlike every other centered element on this card).
function drawTrackedLeft(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  ctx.save();
  ctx.textAlign = "left";
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  ctx.restore();
}

// Draws the "customs endorsement" coupon (perforation + QR + short link)
// introduced in DESIGN.md "Story-card additions — QR + short-link". Payload
// carries ?utm_source=qr; the printed line omits the query string.
function drawQrCoupon(ctx: CanvasRenderingContext2D, shareUrl: string) {
  // perforation rule, y=1470, x 140-940: gold dots at 45% alpha, 3px
  // radius, 34px pitch — the .perf-y punch-dot motif scaled up for this
  // canvas.
  ctx.fillStyle = `${GOLD}73`;
  for (let x = 140; x <= 940; x += 34) {
    ctx.beginPath();
    ctx.arc(x, 1470, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // QR chip: 152x152 cream square, 2px navy contact-stroke border
  const chipX = 140;
  const chipY = 1500;
  const chipSize = 152;
  ctx.fillStyle = CREAM;
  ctx.fillRect(chipX, chipY, chipSize, chipSize);
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2;
  ctx.strokeRect(chipX, chipY, chipSize, chipSize);

  // QR modules, navy on cream, inside an 8px inset (136x136 module area).
  // No dependency on the payload's alphabet/length here — the strip's
  // share URL is always short (see lib/slug.ts), so 'M' error correction
  // at this pixel budget stays comfortably scannable.
  const qr = QRCode.create(`${shareUrl}?utm_source=qr`, {
    errorCorrectionLevel: "M",
  });
  const modules = qr.modules;
  const size = modules.size;
  const area = chipSize - 16; // 8px inset each side
  const cell = area / size;
  const inset = chipX + 8;
  const insetY = chipY + 8;
  ctx.fillStyle = NAVY;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (modules.get(row, col)) {
        ctx.fillRect(
          inset + col * cell,
          insetY + row * cell,
          cell + 0.6,
          cell + 0.6,
        );
      }
    }
  }

  // text block, x 320-940, vertically centered against the chip
  const textX = 320;
  ctx.textAlign = "left";
  ctx.fillStyle = GOLD;
  ctx.font = `600 30px ${GEO}`;
  drawTrackedLeft(ctx, "SCAN TO ENTER", textX, 1538, 4);

  ctx.fillStyle = CREAM;
  ctx.font = `500 30px ${GEO}`;
  drawTrackedLeft(ctx, shareUrl.replace(/^https?:\/\//, ""), textX, 1580, 0.5);

  ctx.fillStyle = `${GOLD}B3`;
  ctx.font = `500 20px ${GEO}`;
  drawTrackedLeft(ctx, "PRESENT THIS CODE AT THE DOOR", textX, 1618, 2);
}

// A 9:16 story card: the strip affixed to the navy passport cover with
// photo corners, company lettering, and the booth seal in gold. When
// `shareUrl` is available it also bakes in a QR + short-link "customs
// endorsement" coupon (DESIGN.md "Story-card additions"); when it's null
// (offline, env-less, or the upload-on-share-intent failed) the card falls
// back to the original layout unchanged — the share still works, just
// without the link-back.
export async function composeShareCard(
  stripBlob: Blob,
  booth: Booth,
  serial: string,
  dateText: string,
  shareUrl: string | null = null,
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

  // strip with shadow + slight rotation. stripH shrinks to 1000 (from 1280)
  // when the QR coupon is present, to keep every new element's bottom edge
  // at or above y=1650 (Stories UI safe zone) without growing the canvas.
  const stripH = shareUrl ? 1000 : 1280;
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

  // caption block — shifted up (and set slightly smaller) when the QR
  // coupon is present, per DESIGN.md "Story-card additions".
  const nameY = shareUrl ? 1380 : 1700;
  const metaY = shareUrl ? 1420 : 1750;
  const nameSize = shareUrl ? 40 : 44;
  const metaSize = shareUrl ? 24 : 26;
  const sealRadius = shareUrl ? 56 : 78;
  const sealCenter: [number, number] = shareUrl ? [930, 1400] : [W - 170, 1745];

  ctx.fillStyle = CREAM;
  ctx.font = `italic 600 ${nameSize}px ${DISPLAY}`;
  ctx.fillText(booth.name, W / 2, nameY);
  ctx.fillStyle = `${GOLD}E6`;
  ctx.font = `500 ${metaSize}px ${GEO}`;
  drawTracked(ctx, `No. ${serial} · DATED ${dateText.toUpperCase()}`, W / 2, metaY, 4);

  drawBoothStamp(
    ctx,
    {
      color: GOLD,
      top: booth.name.toUpperCase(),
      bottom: booth.stampLocale,
      glyph: booth.glyph,
    },
    sealCenter[0],
    sealCenter[1],
    sealRadius,
    0.18,
    0.9,
  );

  if (shareUrl) drawQrCoupon(ctx, shareUrl);

  return new Promise<Blob>((resolve, reject) =>
    c.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("share card export failed"))),
      "image/jpeg",
      0.9,
    ),
  );
}

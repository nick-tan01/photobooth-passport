import { applyFinish, type FinishId } from "./filters";

export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera");
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 1280 },
    },
  });
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

// Centre-cropped square capture, mirrored to match the on-screen preview.
// The chosen print finish is baked in here so thumbnails, the strip, and
// the live (CSS-approximated) viewfinder all agree.
export function captureFrame(
  video: HTMLVideoElement,
  finish: FinishId = "gloss",
  size = 760,
): string {
  const vw = video.videoWidth || 720;
  const vh = video.videoHeight || 720;
  const side = Math.min(vw, vh);
  const sx = (vw - side) / 2;
  const sy = (vh - side) / 2;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.save();
  ctx.translate(size, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, sx, sy, side, side, 0, 0, size, size);
  ctx.restore();
  applyFinish(ctx, size, size, finish);
  return c.toDataURL("image/jpeg", 0.92);
}

// Bureau test pattern, used when no camera is available (and for previews).
// Each exposure gets a rotated wedge and numeral so the four frames differ.
export function captureTestFrame(
  index: number,
  accent: string,
  finish: FinishId = "gloss",
  size = 760,
): string {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = "#EAE2CE";
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((index * 47 + 12) * Math.PI) / 180);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.13;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, size * 0.62, -0.5, 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#22324A";
  ctx.lineWidth = 3;
  for (const r of [0.36, 0.27]) {
    ctx.beginPath();
    ctx.arc(cx, cy, size * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.45, cy);
  ctx.lineTo(cx + size * 0.45, cy);
  ctx.moveTo(cx, cy - size * 0.45);
  ctx.lineTo(cx, cy + size * 0.45);
  ctx.stroke();

  // corner registration marks
  ctx.lineWidth = 3;
  const m = size * 0.06;
  const L = size * 0.055;
  for (const [x, y, dx, dy] of [
    [m, m, 1, 1],
    [size - m, m, -1, 1],
    [m, size - m, 1, -1],
    [size - m, size - m, -1, -1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * L, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * L);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${size * 0.26}px "Playfair Display", Georgia, serif`;
  ctx.fillText(String(index + 1), cx, cy + size * 0.01);

  ctx.fillStyle = "#22324A";
  ctx.font = `500 ${size * 0.036}px Jost, "Avenir Next", sans-serif`;
  ctx.fillText("THE GRAND TOUR CO. — TEST PATTERN", cx, size * 0.1);
  ctx.fillText(`EXPOSURE No. ${index + 1} OF 4 · NO CAMERA PRESENT`, cx, size * 0.91);

  applyFinish(ctx, size, size, finish);
  return c.toDataURL("image/jpeg", 0.9);
}

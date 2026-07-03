import type { GlyphId } from "./types";

export const DISPLAY = '"Playfair Display", Georgia, serif';
export const GEO = 'Jost, "Avenir Next", Futura, sans-serif';

export interface StampSpec {
  top: string;
  bottom: string;
  glyph: GlyphId;
  color: string;
}

// Stroke glyphs centred on (0,0), extent roughly ±18, drawn inside the
// stamp's inner circle. Shared by the SVG builder and the canvas renderer.
const GLYPHS: Record<GlyphId, { d: string; w: number }[]> = {
  camera: [
    { d: "M -16 -5 H 16 V 13 H -16 Z", w: 2.4 },
    { d: "M 0 4 m 8.5 0 a 8.5 8.5 0 1 1 -17 0 a 8.5 8.5 0 1 1 17 0", w: 2.4 },
    { d: "M 0 4 m 3.5 0 a 3.5 3.5 0 1 1 -7 0 a 3.5 3.5 0 1 1 7 0", w: 1.8 },
    { d: "M -7 -11 H 7 V -5", w: 2.2 },
  ],
  moon: [
    { d: "M 4 -13.5 A 13.5 13.5 0 1 0 4 13.5 A 10.5 10.5 0 1 1 4 -13.5 Z", w: 2.4 },
    { d: "M 13 -10 v 7 M 9.5 -6.5 h 7", w: 2 },
  ],
  waves: [
    { d: "M -10 -1 A 10 10 0 0 1 10 -1", w: 2.4 },
    { d: "M 0 -16 v 4 M -12 -11.5 l 3 3 M 12 -11.5 l -3 3", w: 2.2 },
    { d: "M -17 6 q 4.2 -6 8.5 0 t 8.5 0 t 8.5 0", w: 2.2 },
    { d: "M -17 13 q 4.2 -6 8.5 0 t 8.5 0 t 8.5 0", w: 2.2 },
  ],
  falls: [
    { d: "M -14 -7 A 14 8 0 0 1 14 -7", w: 2.4 },
    {
      d: "M -14 -7 q -1.2 10 -1.2 15 M -7 -10 q -0.3 9 -0.3 16 M 0 -11 V 6 M 7 -10 q 0.3 9 0.3 16 M 14 -7 q 1.2 10 1.2 15",
      w: 2,
    },
    { d: "M -9 12 h 3.4 M -1 14 h 3.4 M 7 12 h 3.4", w: 2 },
  ],
  fleur: [
    { d: "M 0 -15 q 5.5 7.5 0 16 q -5.5 -8.5 0 -16 Z", w: 2.2 },
    { d: "M -12 -7 q 8 0.5 12 8.5", w: 2.2 },
    { d: "M 12 -7 q -8 0.5 -12 8.5", w: 2.2 },
    { d: "M -7 5.5 H 7 M 0 5.5 V 13", w: 2.2 },
  ],
  bunting: [
    { d: "M -16 -9 q 16 9 32 0", w: 2.2 },
    {
      d: "M -12 -5.8 L -8.5 0.8 L -5 -4.8 M -3.8 -4.4 L -0.4 1.8 L 3 -4.2 M 4.6 -4.6 L 8 1 L 11.6 -5.4",
      w: 2,
    },
    { d: "M 0 11 m 4 0 a 4 4 0 1 1 -8 0 a 4 4 0 1 1 8 0", w: 2 },
  ],
  snow: [
    { d: "M 0 -15 V 15 M -13 -7.5 L 13 7.5 M -13 7.5 L 13 -7.5", w: 2 },
    { d: "M -4 -10 L 0 -6 L 4 -10 M -4 10 L 0 6 L 4 10", w: 1.8 },
  ],
};

// Escape everything that could break out of an SVG attribute/text context.
// The result is fed to dangerouslySetInnerHTML, so quotes MUST be encoded too —
// without that, a value with a `"` could inject new attributes (e.g. an onload
// handler) onto the element.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Colors are interpolated raw into stroke="…"/fill="…". Only allow real CSS
// color syntax; anything else can't reach the attribute, so it can't break out.
function safeColor(c: string): string {
  return /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d.,\s%]+\)$|^hsla?\([\d.,\s%]+\)$|^[a-zA-Z]{1,24}$/.test(
    c,
  )
    ? c
    : "#000000";
}

export function buildBoothStampSvg(spec: StampSpec, uid: string): string {
  const { top, bottom, glyph, color } = spec;
  const c = safeColor(color);
  const topSize = top.length > 16 ? 8.5 : 10.5;
  const topTrack = top.length > 16 ? 1.1 : 1.8;
  const paths = GLYPHS[glyph]
    .map((p) => `<path d="${p.d}" stroke-width="${p.w}"/>`)
    .join("");
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(top)} stamp">
<defs>
<filter id="rg-${uid}" x="-8%" y="-8%" width="116%" height="116%">
<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6"/>
</filter>
<path id="at-${uid}" d="M 14 60 A 46 46 0 0 1 106 60" fill="none"/>
<path id="ab-${uid}" d="M 14 60 A 46 46 0 0 0 106 60" fill="none"/>
</defs>
<g filter="url(#rg-${uid})" stroke="${c}" fill="none" stroke-linecap="round" stroke-linejoin="round">
<circle cx="60" cy="60" r="55" stroke-width="3"/>
<circle cx="60" cy="60" r="37" stroke-width="1.3"/>
<g transform="translate(60 60)">${paths}</g>
<g stroke="none" fill="${c}" font-family="${esc(DISPLAY)}">
<text font-size="${topSize}" letter-spacing="${topTrack}"><textPath href="#at-${uid}" startOffset="50%" text-anchor="middle">${esc(top)}</textPath></text>
<text font-size="8.5" letter-spacing="1.2"><textPath href="#ab-${uid}" startOffset="50%" text-anchor="middle">${esc(bottom)}</textPath></text>
</g>
<circle cx="14" cy="60" r="1.8" fill="${c}" stroke="none"/>
<circle cx="106" cy="60" r="1.8" fill="${c}" stroke="none"/>
</g>
</svg>`;
}

export function buildEntryStampSvg(
  opts: { word: string; date: string; color: string },
  uid: string,
): string {
  const { word, date, color } = opts;
  const c = safeColor(color);
  return `<svg viewBox="0 0 230 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(word)} ${esc(date)}">
<defs>
<filter id="re-${uid}" x="-8%" y="-12%" width="116%" height="124%">
<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="11" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="1.8"/>
</filter>
</defs>
<g filter="url(#re-${uid})" stroke="${c}" fill="none">
<rect x="4" y="4" width="222" height="88" stroke-width="3"/>
<rect x="11" y="11" width="208" height="74" stroke-width="1.3"/>
<text x="115" y="50" stroke="none" fill="${c}" font-family="${esc(DISPLAY)}" font-weight="700" font-size="26" letter-spacing="6" text-anchor="middle">${esc(word)}</text>
<text x="115" y="73" stroke="none" fill="${c}" font-family="${esc(DISPLAY)}" font-size="12" letter-spacing="3" text-anchor="middle">· ${esc(date)} ·</text>
</g>
</svg>`;
}

// ---- canvas renderer (used by the strip compositor, full font fidelity) ----

function drawArcText(
  ctx: CanvasRenderingContext2D,
  text: string,
  radius: number,
  centerAngle: number,
  fontPx: number,
  tracking: number,
  inward: boolean,
) {
  ctx.font = `${fontPx}px ${DISPLAY}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width + tracking);
  const total = widths.reduce((a, b) => a + b, 0);
  let angle = inward
    ? centerAngle + total / 2 / radius
    : centerAngle - total / 2 / radius;
  for (let i = 0; i < chars.length; i++) {
    const half = widths[i] / 2 / radius;
    angle += inward ? -half : half;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + (inward ? -Math.PI / 2 : Math.PI / 2));
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    angle += inward ? -half : half;
  }
}

export function drawBoothStamp(
  ctx: CanvasRenderingContext2D,
  spec: StampSpec,
  cx: number,
  cy: number,
  radius: number,
  rotation = 0,
  alpha = 0.85,
) {
  const s = radius / 60;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(s, s);
  ctx.strokeStyle = spec.color;
  ctx.fillStyle = spec.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // two passes: solid impression + faintly offset ghost for ink bleed
  const passes: [number, number, number][] = [
    [0, 0, alpha],
    [0.7, 0.5, alpha * 0.22],
  ];
  for (const [ox, oy, a] of passes) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.globalAlpha = a;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, 37, 0, Math.PI * 2);
    ctx.stroke();
    for (const p of GLYPHS[spec.glyph]) {
      ctx.lineWidth = p.w;
      ctx.stroke(new Path2D(p.d));
    }
    drawArcText(
      ctx,
      spec.top,
      46,
      -Math.PI / 2,
      spec.top.length > 16 ? 8.5 : 10.5,
      spec.top.length > 16 ? 1.2 : 2,
      false,
    );
    drawArcText(ctx, spec.bottom, 46, Math.PI / 2, 8.5, 1.4, true);
    ctx.beginPath();
    ctx.arc(-46, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

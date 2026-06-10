const NOISE_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 0.16 0 0 0 0 0.14 0 0 0 0 0.11 0 0 0 0.055 0'/></filter><rect width='160' height='160' filter='url(#n)'/></svg>`,
);

// Paper tooth over the whole screen + a faint worn-edge vignette.
export default function PaperTexture({ vignette = true }: { vignette?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-40">
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")` }}
      />
      {vignette && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 45%, rgba(41,37,31,0) 62%, rgba(41,37,31,0.14) 100%)",
          }}
        />
      )}
    </div>
  );
}

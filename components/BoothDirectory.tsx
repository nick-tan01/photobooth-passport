"use client";

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { BOOTHS } from "@/lib/booths";
import { listStrips } from "@/lib/storage";
import { BoothStamp } from "./Stamp";
import PaperTexture from "./PaperTexture";

function BoothRow({
  booth,
  index,
  onSelect,
}: {
  booth: Booth;
  index: number;
  onSelect: () => void;
}) {
  const ex = booth.exclusive;
  return (
    <button
      onClick={onSelect}
      className={`press relative block w-full border-b border-navy/20 px-5 py-4 text-left ${
        ex ? "border-l-[3px] border-l-gold bg-paper" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2.5">
            <span className="font-geo text-[14px] font-semibold tracking-[0.08em] text-signal">
              {booth.prefix}
            </span>
            <span className="font-display text-[19px] font-semibold text-ink">
              {booth.name}
            </span>
          </div>
          <p className="mt-1 font-geo text-[9px] tracking-[0.12em] text-faded">
            {booth.locale} — {booth.motto}
          </p>
          {ex && (
            <>
              <span className="mt-2 inline-block bg-signal px-2 py-[3px] font-geo text-[8px] font-semibold tracking-[0.18em] text-paper">
                ON LOCATION ONLY
              </span>
              <p className="mt-1.5 font-geo text-[9px] text-faded">{ex.note}</p>
            </>
          )}
        </div>
        <div
          className={`shrink-0 ${ex ? "rounded-full border-2 border-gold p-[3px]" : ""}`}
        >
          <BoothStamp
            booth={booth}
            className={ex ? "w-[46px]" : "w-[46px] opacity-85"}
            style={{ transform: `rotate(${index % 2 ? 5 : -6}deg)` }}
          />
        </div>
      </div>
    </button>
  );
}

export default function BoothDirectory({
  onSelect,
  onPassport,
  onMap,
}: {
  onSelect: (b: Booth) => void;
  onPassport: () => void;
  onMap: () => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    listStrips()
      .then((r) => setCount(r.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="relative min-h-dvh bg-cream pb-10">
      <header className="relative z-10 bg-navy px-5 pb-4 pt-7">
        <div className="flex items-baseline justify-between">
          <span className="font-geo text-[9px] font-semibold tracking-[0.3em] text-gold">
            PHOTOBOOTH PASSPORT
          </span>
          <span className="flex items-center gap-4">
            <button
              onClick={onMap}
              className="font-geo text-[10.5px] tracking-[0.2em] text-paper/85 underline decoration-gold/60 underline-offset-4"
            >
              MAP
            </button>
            <button
              onClick={onPassport}
              className="font-geo text-[10.5px] tracking-[0.2em] text-paper/85 underline decoration-gold/60 underline-offset-4"
            >
              PASSPORT{count ? ` (${count})` : ""}
            </button>
          </span>
        </div>
        <h1 className="mt-2 font-display text-[26px] font-semibold text-paper">
          Booth Directory
        </h1>
        <p className="mt-[2px] font-geo text-[9px] tracking-[0.25em] text-gold">
          DEPARTURES · FOUR EXPOSURES PER SITTING
        </p>
      </header>
      <div className="relative z-10 h-[3px] bg-gold" />

      <div className="relative z-10">
        {BOOTHS.map((b, i) => (
          <BoothRow key={b.id} booth={b} index={i} onSelect={() => onSelect(b)} />
        ))}
      </div>

      <footer className="relative z-10 mt-8 text-center font-geo text-[8.5px] tracking-[0.22em] text-faded">
        ISSUED BY THE GRAND TOUR COMPANY · EST. 2026
      </footer>

      <PaperTexture />
    </div>
  );
}

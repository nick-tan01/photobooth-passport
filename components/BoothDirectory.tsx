"use client";

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { BOOTHS } from "@/lib/booths";
import { listStrips } from "@/lib/storage";
import { BoothStamp } from "./Stamp";
import { TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

function BoothTicket({
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
      className="press relative block w-full text-left"
      style={{ transform: `rotate(${index % 2 ? 0.45 : -0.45}deg)` }}
    >
      <div className="relative flex overflow-hidden border-[1.5px] border-ink bg-paper shadow-strip">
        <div className="relative flex w-[54px] shrink-0 items-center justify-center border-r border-dashed border-ink/45 bg-manila-deep/60">
          <span
            className="font-type text-[10px] tracking-[0.3em] text-ink-soft"
            style={{ writingMode: "vertical-rl" }}
          >
            {booth.prefix} · ADMIT ALL
          </span>
          <div
            className="perf-y absolute -right-[3px] top-0 h-full w-[6px]"
            style={{ "--perf": "#EDE3CC" } as React.CSSProperties}
          />
        </div>

        <div className="relative flex-1 px-4 py-4">
          <h2 className="font-caslon text-[19px] font-bold text-ink">
            {booth.name}
          </h2>
          <p
            className="mt-[2px] font-type text-[10.5px] tracking-[0.18em]"
            style={{ color: booth.accent }}
          >
            {booth.locale}
          </p>
          <p className="mt-2 max-w-[210px] font-type text-[12.5px] leading-snug text-ink-soft">
            {booth.tagline}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="font-type text-[10px] tracking-[0.14em] text-faded">
              4 EXPOSURES · 1 AMENDMENT
            </span>
            <span className="mr-1 font-type text-[12px] tracking-[0.2em] text-ink">
              ENTER →
            </span>
          </div>
          {ex && (
            <p className="mt-2 font-type text-[9.5px] tracking-[0.06em] text-faded">
              {ex.note}
            </p>
          )}
        </div>

        <div className="pointer-events-none absolute -right-1 top-1 w-[88px] rotate-[9deg] opacity-[0.15]">
          <BoothStamp booth={booth} />
        </div>

        {ex && (
          <div className="pointer-events-none absolute -right-[40px] top-[26px] rotate-[31deg] bg-stamp px-12 py-[3px]">
            <span className="font-caslon text-[11px] font-bold tracking-[0.24em] text-paper">
              ON LOCATION
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function BoothDirectory({
  onSelect,
  onPassport,
}: {
  onSelect: (b: Booth) => void;
  onPassport: () => void;
}) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    listStrips()
      .then((r) => setCount(r.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="relative min-h-dvh bg-manila px-5 pb-10 pt-7">
      <header className="relative z-10">
        <p className="font-type text-[10px] tracking-[0.24em] text-faded">
          BUREAU OF MEMORIES · DEPT. OF SOUVENIRS
        </p>
        <div className="mt-3 flex items-end justify-between">
          <h1 className="font-caslon text-[27px] font-bold text-ink">
            Booth Directory
          </h1>
          <TypeLink onClick={onPassport} className="mb-1">
            MY PASSPORT{count ? ` (${count})` : ""} →
          </TypeLink>
        </div>
        <div className="mt-2 border-t-2 border-ink" />
        <div className="mt-[3px] border-t border-ink/40" />
        <p className="mt-2 font-type text-[12px] text-ink-soft">
          Choose a booth. The sitting begins inside.
        </p>
      </header>

      <div className="relative z-10 mt-6 space-y-5">
        {BOOTHS.map((b, i) => (
          <BoothTicket
            key={b.id}
            booth={b}
            index={i}
            onSelect={() => onSelect(b)}
          />
        ))}
      </div>

      <footer className="relative z-10 mt-10 text-center font-type text-[9.5px] tracking-[0.18em] text-faded">
        APPARATUS & ISSUE — BUREAU OF MEMORIES · FORM 1 REV. C
      </footer>

      <PaperTexture />
    </div>
  );
}

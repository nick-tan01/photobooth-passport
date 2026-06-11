"use client";

import { useEffect, useState } from "react";
import type { Booth, Charter } from "@/lib/types";
import { PLACES, SEASONALS, isInSeason } from "@/lib/booths";
import { unlockedCharters, unlockCharter } from "@/lib/charters";
import { listStrips } from "@/lib/storage";
import { signal } from "@/lib/signals";
import { BoothStamp } from "./Stamp";
import PaperTexture from "./PaperTexture";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-5 pb-1 pt-5 font-geo text-[9px] font-semibold tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

function BoothRow({
  booth,
  index,
  onSelect,
  locked,
}: {
  booth: Booth;
  index: number;
  onSelect: () => void;
  locked?: string;
}) {
  const ex = booth.exclusive;
  return (
    <button
      onClick={onSelect}
      disabled={!!locked}
      className={`press relative block w-full border-b border-navy/20 px-5 py-4 text-left ${
        ex ? "border-l-[3px] border-l-gold bg-paper" : ""
      } ${locked ? "opacity-100" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`min-w-0 ${locked ? "opacity-50" : ""}`}>
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
          {ex && !locked && (
            <>
              <span className="mt-2 inline-block bg-signal px-2 py-[3px] font-geo text-[8px] font-semibold tracking-[0.18em] text-paper">
                ON LOCATION ONLY
              </span>
              <p className="mt-1.5 font-geo text-[9px] text-faded">{ex.note}</p>
            </>
          )}
          {locked && (
            <span className="mt-2 inline-block border border-dashed border-faded px-2 py-[3px] font-geo text-[8px] font-semibold tracking-[0.18em] text-faded">
              {locked}
            </span>
          )}
        </div>
        <div
          className={`shrink-0 ${ex ? "rounded-full border-2 border-gold p-[3px]" : ""} ${
            locked ? "opacity-35 grayscale" : ""
          }`}
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
  const [charters, setCharters] = useState<Charter[]>([]);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    listStrips()
      .then((r) => setCount(r.length))
      .catch(() => setCount(0));
    setCharters(unlockedCharters());
  }, []);

  function tryUnlock() {
    if (!code.trim()) return;
    const charter = unlockCharter(code);
    if (charter) {
      setCharters(unlockedCharters());
      setCode("");
      setCodeError(false);
      signal("charter_unlocked");
    } else {
      setCodeError(true);
    }
  }

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
        <SectionLabel>PORTS OF CALL</SectionLabel>
        {PLACES.map((b, i) => (
          <BoothRow key={b.id} booth={b} index={i} onSelect={() => onSelect(b)} />
        ))}

        <SectionLabel>THE SEASON</SectionLabel>
        {SEASONALS.map((b, i) => (
          <BoothRow
            key={b.id}
            booth={b}
            index={i + 1}
            onSelect={() => onSelect(b)}
            locked={isInSeason(b) ? undefined : b.season?.returns}
          />
        ))}

        <SectionLabel>PRIVATE CHARTERS</SectionLabel>
        {charters.map((b, i) => (
          <BoothRow key={b.id} booth={b} index={i} onSelect={() => onSelect(b)} />
        ))}
        <div className="border-b border-navy/20 px-5 py-4">
          <p className="font-geo text-[11px] tracking-[0.06em] text-ink-soft">
            Attending a private engagement? Present your booking reference.
          </p>
          <div className="mt-2 flex items-end gap-3">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") tryUnlock();
              }}
              maxLength={10}
              placeholder="BOOKING REF."
              aria-label="Booking reference"
              className="typed-field font-geo w-[150px] uppercase tracking-[0.18em]"
            />
            <button
              onClick={tryUnlock}
              className="press border border-navy-deep bg-navy px-3 py-[7px] font-geo text-[10.5px] tracking-[0.18em] text-paper"
            >
              PRESENT
            </button>
          </div>
          {codeError && (
            <p className="mt-2 font-geo text-[10px] tracking-[0.1em] text-signal">
              NOT ON THE MANIFEST — CHECK THE REFERENCE.
            </p>
          )}
        </div>
      </div>

      <footer className="relative z-10 mt-8 text-center font-geo text-[8.5px] tracking-[0.22em] text-faded">
        ISSUED BY THE GRAND TOUR COMPANY · EST. 2026
      </footer>

      <PaperTexture />
    </div>
  );
}

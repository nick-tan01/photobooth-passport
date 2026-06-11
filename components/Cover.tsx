"use client";

import { useEffect, useState } from "react";
import PaperTexture from "./PaperTexture";
import { SealStamp } from "./Stamp";

export default function Cover({ onOpen }: { onOpen: () => void }) {
  const [holder, setHolder] = useState("");
  useEffect(() => {
    try {
      setHolder(localStorage.getItem("pp-holder") || "");
    } catch {
      // unavailable storage just means an unregistered passport
    }
  }, []);
  return (
    <button
      onClick={onOpen}
      className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-navy px-8 pb-safe-xl pt-safe-xl text-center"
      aria-label="Open your photobooth passport"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 border-2 border-gold/65"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 border border-gold/35"
      />

      <p className="relative z-10 font-geo text-[11px] tracking-[0.32em] text-gold/75">
        TRAVEL DOCUMENT · TYPE P
      </p>

      <div className="relative z-10 flex flex-col items-center gap-9">
        <h1 className="font-display text-[30px] font-bold leading-[1.35] tracking-[0.16em] text-gold [text-shadow:0_1px_0_rgba(0,0,0,0.35)]">
          PHOTOBOOTH
          <br />
          PASSPORT
        </h1>
        <SealStamp
          top="GRAND TOUR COMPANY"
          bottom="PHOTOGRAPHIC RECORDS"
          glyph="camera"
          color="#C9A86A"
          className="w-36 opacity-90"
        />
        <p className="font-display text-[14px] italic text-gold/85">
          Four exposures. One strip. Stamped for keeps.
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3">
        {holder && (
          <p className="font-geo text-[11px] tracking-[0.26em] text-gold/85">
            HOLDER · {holder.toUpperCase()}
          </p>
        )}
        <p className="soft-blink font-geo text-[12px] tracking-[0.3em] text-gold/75">
          TAP TO OPEN
        </p>
      </div>

      <PaperTexture />
    </button>
  );
}

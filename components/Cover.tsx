"use client";

import PaperTexture from "./PaperTexture";
import { SealStamp } from "./Stamp";

export default function Cover({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden bg-oxblood px-8 pb-12 pt-14 text-center"
      aria-label="Open your photobooth passport"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-4 border-2 border-brass/65"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-6 border border-brass/35"
      />

      <p className="relative z-10 font-type text-[11px] tracking-[0.32em] text-brass/75">
        TRAVEL DOCUMENT · TYPE P
      </p>

      <div className="relative z-10 flex flex-col items-center gap-9">
        <h1 className="font-caslon text-[30px] font-bold leading-[1.35] tracking-[0.16em] text-brass [text-shadow:0_1px_0_rgba(0,0,0,0.35)]">
          PHOTOBOOTH
          <br />
          PASSPORT
        </h1>
        <SealStamp
          top="BUREAU OF MEMORIES"
          bottom="PHOTOGRAPHIC RECORDS"
          glyph="standard"
          color="#B08D3F"
          className="w-36 opacity-90"
        />
        <p className="font-caslon text-[14px] italic text-brass/85">
          Four exposures. One strip. Stamped for keeps.
        </p>
      </div>

      <p className="soft-blink relative z-10 font-type text-[12px] tracking-[0.3em] text-brass/75">
        TAP TO OPEN
      </p>

      <PaperTexture />
    </button>
  );
}

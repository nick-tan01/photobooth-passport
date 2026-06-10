"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { PlateButton } from "./Controls";
import PaperTexture from "./PaperTexture";

interface Props {
  stripUrl: string | null;
  caption: string;
  dateText: string;
  onCaption: (v: string) => void;
  onDate: (v: string) => void;
  recompose: (caption: string, dateText: string) => void;
  onAffix: () => void;
}

const CORNER = "absolute h-7 w-7 bg-[#DFD3B4] shadow-sm";

export function PhotoCorners() {
  return (
    <>
      <span
        aria-hidden
        className={`${CORNER} -left-[6px] -top-[6px]`}
        style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
      />
      <span
        aria-hidden
        className={`${CORNER} -right-[6px] -top-[6px]`}
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
      />
      <span
        aria-hidden
        className={`${CORNER} -bottom-[6px] -left-[6px]`}
        style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
      />
      <span
        aria-hidden
        className={`${CORNER} -bottom-[6px] -right-[6px]`}
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
    </>
  );
}

export default function CustomizeStrip({
  stripUrl,
  caption,
  dateText,
  onCaption,
  onDate,
  recompose,
  onAffix,
}: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ caption, dateText });
  latest.current = { caption, dateText };

  const schedule = (cap: string, date: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => recompose(cap, date), 450);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className="relative min-h-dvh bg-cream px-5 pb-10 pt-7">
      <p className="relative z-10 text-center font-geo text-[10px] tracking-[0.26em] text-faded">
        FINISHING · THE STRIP PRINTS WHAT YOU TYPE
      </p>

      <div className="relative z-10 mx-auto mt-5 w-fit rotate-[-0.6deg]">
        {stripUrl && (
          <img
            src={stripUrl}
            alt="Photo strip preview"
            className="block w-auto shadow-strip"
            style={{ height: "min(46dvh, 420px)" }}
          />
        )}
        <PhotoCorners />
      </div>

      <div className="relative z-10 mx-auto mt-6 w-full max-w-[320px] space-y-5">
        <label className="block">
          <span className="font-geo text-[10px] tracking-[0.24em] text-faded">
            CAPTION — OPTIONAL
          </span>
          <input
            value={caption}
            maxLength={28}
            onChange={(e) => {
              onCaption(e.target.value);
              schedule(e.target.value, latest.current.dateText);
            }}
            placeholder="Write something small"
            className="typed-field font-display mt-1 w-full text-center italic tracking-wide"
          />
        </label>
        <label className="mx-auto block w-[220px]">
          <span className="font-geo text-[10px] tracking-[0.24em] text-faded">
            DATED
          </span>
          <input
            value={dateText}
            maxLength={16}
            onChange={(e) => {
              onDate(e.target.value);
              schedule(latest.current.caption, e.target.value);
            }}
            className="typed-field font-geo mt-1 w-full text-center uppercase tracking-wide"
          />
        </label>
      </div>

      <div className="relative z-10 mx-auto mt-7 w-full max-w-[330px]">
        <PlateButton onClick={onAffix}>Affix &amp; stamp</PlateButton>
        <p className="mt-3 text-center font-geo text-[10px] tracking-[0.2em] text-faded">
          THE RECORD WILL BE FILED IN YOUR PASSPORT
        </p>
      </div>

      <PaperTexture />
    </div>
  );
}

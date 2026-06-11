"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { FINISHES, type FinishId } from "@/lib/filters";
import { PlateButton } from "./Controls";
import PaperTexture from "./PaperTexture";

interface Props {
  stripUrl: string | null;
  caption: string;
  dateText: string;
  finish: FinishId;
  onCaption: (v: string) => void;
  onDate: (v: string) => void;
  onFinish: (f: FinishId) => void;
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
  finish,
  onCaption,
  onDate,
  onFinish,
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
    <div className="relative min-h-dvh bg-cream px-5 pb-10 pt-safe">
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

      <div className="relative z-10 mx-auto mt-5 w-full max-w-[330px]">
        <p className="text-center font-geo text-[10px] tracking-[0.24em] text-faded">
          FINISH — THE STRIP REPRINTS AS YOU CHOOSE
        </p>
        <div
          className="mt-2 flex justify-center gap-2"
          role="radiogroup"
          aria-label="Print finish"
        >
          {FINISHES.map((f) => {
            const active = finish === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFinish(f.id)}
                role="radio"
                aria-checked={active}
                title={f.blurb}
                className={`press flex w-[76px] flex-col items-center gap-1 px-1 py-2 ${
                  active
                    ? "border-[1.5px] border-navy bg-navy/[0.06]"
                    : "border border-ink/30"
                }`}
              >
                <span
                  aria-hidden
                  className="h-[22px] w-[22px] rounded-full border border-ink/25"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, #E8C49A 0%, #C98E6B 38%, #8A5E48 62%, #1F3A5F 100%)",
                    filter: f.css,
                  }}
                />
                <span className="font-geo text-[9px] font-semibold tracking-[0.12em] text-ink">
                  {f.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-5 w-full max-w-[320px] space-y-5">
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

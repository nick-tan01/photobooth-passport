"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { playMotor } from "@/lib/audio";
import { PlateButton, TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

interface Props {
  stripUrl: string | null;
  retakeUsed: boolean;
  onAmend: () => void;
  onProceed: () => void;
}

const PRINT_MS = 3500;

export default function StripReveal({
  stripUrl,
  retakeUsed,
  onAmend,
  onProceed,
}: Props) {
  const [printed, setPrinted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!stripUrl) return;
    playMotor(PRINT_MS - 100);
    const t = setTimeout(() => setPrinted(true), PRINT_MS);
    return () => clearTimeout(t);
  }, [stripUrl]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-cream px-5 pb-8 pt-7">
      <p className="relative z-10 text-center font-geo text-[10px] tracking-[0.26em] text-faded">
        THE GRAND TOUR COMPANY · DELIVERY
      </p>

      {/* the slot */}
      <div className="relative z-20 mx-auto mt-3 w-full max-w-[300px]">
        <div className="relative bg-booth px-3 pb-[7px] pt-[9px] shadow-plate">
          <div className="flex items-center justify-between">
            <span className="h-[7px] w-[7px] rounded-full bg-paper/30" />
            <span className="block h-[6px] w-[180px] bg-black" />
            <span className="h-[7px] w-[7px] rounded-full bg-paper/30" />
          </div>
          <p className="mt-[6px] text-center font-geo text-[8.5px] tracking-[0.24em] text-paper/45">
            DO NOT REACH INTO THE SLOT
          </p>
        </div>
      </div>

      {/* the print */}
      <div className="relative z-10 mx-auto flex justify-center overflow-hidden pb-2">
        {stripUrl ? (
          <img
            key={stripUrl}
            src={stripUrl}
            alt="Your photo strip"
            className="print-down block w-auto shadow-strip"
            style={{ height: "min(56dvh, 500px)" }}
          />
        ) : (
          <div
            className="flex w-[130px] items-center justify-center"
            style={{ height: "min(56dvh, 500px)" }}
          >
            <span className="soft-blink font-geo text-[11px] tracking-[0.25em] text-faded">
              DEVELOPING…
            </span>
          </div>
        )}
      </div>

      {printed && !confirming && (
        <div className="rise-in relative z-10 mx-auto mt-4 w-full max-w-[330px]">
          <PlateButton onClick={onProceed}>Affix to passport →</PlateButton>
          <div className="mt-4 text-center">
            {retakeUsed ? (
              <span className="font-geo text-[10.5px] tracking-[0.14em] text-faded">
                AMENDMENT USED — NO FURTHER RE-SITTINGS
              </span>
            ) : (
              <TypeLink onClick={() => setConfirming(true)}>
                REQUEST AN AMENDMENT — ONE PERMITTED
              </TypeLink>
            )}
          </div>
        </div>
      )}

      {printed && confirming && (
        <div className="rise-in relative z-10 mx-auto mt-4 w-full max-w-[330px] border-2 border-ink bg-paper px-4 py-4 shadow-strip">
          <p className="font-geo text-[12.5px] leading-snug text-ink">
            An amendment voids these exposures. The company permits ONE (1) per
            record.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={onAmend}
              className="press border-[1.5px] border-signal px-3 py-2 font-geo text-[11.5px] tracking-[0.14em] text-signal"
            >
              RE-SIT NOW
            </button>
            <TypeLink onClick={() => setConfirming(false)}>
              KEEP THE STRIP
            </TypeLink>
          </div>
        </div>
      )}

      <PaperTexture />
    </div>
  );
}

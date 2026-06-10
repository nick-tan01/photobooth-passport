"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { playThunk, buzz } from "@/lib/audio";
import { EntryStamp } from "./Stamp";
import { PlateButton, TypeLink } from "./Controls";
import { PhotoCorners } from "./CustomizeStrip";
import PaperTexture from "./PaperTexture";

interface Props {
  booth: Booth;
  serial: string;
  dateText: string;
  stripUrl: string | null;
  getBlob: () => Blob | null;
  onPassport: () => void;
  onDirectory: () => void;
}

export default function Admitted({
  booth,
  serial,
  dateText,
  stripUrl,
  getBlob,
  onPassport,
  onDirectory,
}: Props) {
  const [stamped, setStamped] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.canShare);
    const t = setTimeout(() => {
      setStamped(true);
      playThunk(2);
      buzz(60);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  function download() {
    const blob = getBlob();
    if (!blob) return;
    const a = document.createElement("a");
    const u = URL.createObjectURL(blob);
    a.href = u;
    a.download = `photobooth-${serial}.jpg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }

  async function share() {
    const blob = getBlob();
    if (!blob) return;
    const file = new File([blob], `photobooth-${serial}.jpg`, {
      type: "image/jpeg",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Photobooth Passport" });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    download();
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-cream px-5 pb-10 pt-9">
      <p className="relative z-10 text-center font-geo text-[10px] tracking-[0.26em] text-faded">
        THE GRAND TOUR COMPANY
      </p>
      <h1 className="relative z-10 mt-1 text-center font-display text-[26px] font-bold text-ink">
        Record filed.
      </h1>
      <p className="relative z-10 mt-1 text-center font-geo text-[11.5px] tracking-[0.14em] text-ink-soft">
        No. {serial} — {booth.name.toUpperCase()}
      </p>

      <div className="relative z-10 mx-auto mt-6 w-fit rotate-[0.8deg]">
        {stripUrl && (
          <img
            src={stripUrl}
            alt="Your filed photo strip"
            className="block w-auto shadow-strip"
            style={{ height: "min(42dvh, 380px)" }}
          />
        )}
        <PhotoCorners />
        {stamped && (
          <div
            className="thunk-in absolute -bottom-7 -left-10 w-[200px]"
            style={{ "--thunk-rot": "-9deg" } as React.CSSProperties}
          >
            <EntryStamp date={dateText.toUpperCase()} />
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto mt-9 w-full max-w-[330px]">
        <PlateButton onClick={canShare ? share : download}>
          {canShare ? "Share the strip" : "Download the strip"}
        </PlateButton>
        <div className="mt-4 flex items-center justify-center gap-6">
          {canShare && <TypeLink onClick={download}>DOWNLOAD</TypeLink>}
          <TypeLink onClick={onPassport}>MY PASSPORT →</TypeLink>
          <TypeLink onClick={onDirectory}>THE BOOTHS</TypeLink>
        </div>
      </div>

      <PaperTexture />
    </div>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { playThunk, buzz } from "@/lib/audio";
import { composeShareCard } from "@/lib/sharecard";
import { signal } from "@/lib/signals";
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
  const [printNoted, setPrintNoted] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.canShare);
    const t = setTimeout(() => {
      setStamped(true);
      playThunk(2);
      buzz(60);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  function saveBlob(blob: Blob, name: string) {
    const a = document.createElement("a");
    const u = URL.createObjectURL(blob);
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  }

  function download() {
    const blob = getBlob();
    if (!blob) return;
    signal("strip_shared");
    saveBlob(blob, `photobooth-${serial}.jpg`);
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
        signal("strip_shared");
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    download();
  }

  async function shareStoryCard() {
    const blob = getBlob();
    if (!blob || cardBusy) return;
    setCardBusy(true);
    try {
      const card = await composeShareCard(blob, booth, serial, dateText);
      signal("story_card_shared");
      const file = new File([card], `story-${serial}.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {});
      } else {
        saveBlob(card, `story-${serial}.jpg`);
      }
    } catch {
      // card composition failed; the plain strip share still works
    } finally {
      setCardBusy(false);
    }
  }

  function printInterest() {
    if (!printNoted) signal("print_interest");
    setPrintNoted(true);
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
        <div className="mt-4 flex items-center justify-center gap-5">
          {canShare && <TypeLink onClick={download}>DOWNLOAD</TypeLink>}
          <TypeLink onClick={shareStoryCard} disabled={cardBusy}>
            {cardBusy ? "PRINTING CARD…" : "STORY CARD 9:16"}
          </TypeLink>
          <TypeLink onClick={printInterest}>ORDER PRINTS</TypeLink>
        </div>
        {printNoted && (
          <p className="mt-3 text-center font-geo text-[10px] tracking-[0.16em] text-gold">
            THE PRINT DESK OPENS SOON — YOUR INTEREST IS NOTED.
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-6">
          <TypeLink onClick={onPassport}>MY PASSPORT →</TypeLink>
          <TypeLink onClick={onDirectory}>THE BOOTHS</TypeLink>
        </div>
      </div>

      <PaperTexture />
    </div>
  );
}

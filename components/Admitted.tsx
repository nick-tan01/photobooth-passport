"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { playThunk, buzz } from "@/lib/audio";
import { composeShareCard } from "@/lib/sharecard";
import { ensureShareTarget, type ShareTarget } from "@/lib/shareUpload";
import { signal } from "@/lib/signals";
import { EntryStamp } from "./Stamp";
import { PlateButton, TypeLink } from "./Controls";
import { PhotoCorners } from "./CustomizeStrip";
import PaperTexture from "./PaperTexture";

interface Props {
  booth: Booth;
  serial: string;
  dateText: string;
  caption: string;
  stripId: string;
  stripUrl: string | null;
  getBlob: () => Blob | null;
  onPassport: () => void;
  onDirectory: () => void;
}

export default function Admitted({
  booth,
  serial,
  dateText,
  caption,
  stripId,
  stripUrl,
  getBlob,
  onPassport,
  onDirectory,
}: Props) {
  const [stamped, setStamped] = useState(false);
  const [printNoted, setPrintNoted] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setStamped(true);
      playThunk(2);
      buzz(60);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  // Some browsers leave a clipboard-write permission prompt indefinitely
  // unresolved (neither granted nor denied) instead of rejecting — without
  // a bound, that would hang the calling async function forever and leave
  // its busy-guard stuck (permanently disabling the button). 4s is a plain
  // clipboard write; anything slower is treated the same as a denial.
  function writeClipboard(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("clipboard timeout")), 4000);
      navigator.clipboard.writeText(text).then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

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

  // Uploads the strip on the FIRST share intent (share sheet, story card,
  // or copy-link — whichever happens first) and caches the resulting
  // slug/URL on the IndexedDB record so every later share of this strip
  // reuses it. Resolves to null (never throws) when offline, env-less, or
  // the upload fails — callers fall back to an image-only share.
  async function resolveShareTarget(blob: Blob): Promise<ShareTarget | null> {
    return ensureShareTarget(stripId, blob, booth, serial, dateText, caption);
  }

  // Share stays the stated action even when the native share sheet can't
  // carry files: the fallback is copying the share-page link, not silently
  // downgrading to a file download (DESIGN.md "Admitted screen — share
  // dominance"). A download only happens as the last resort, when there's
  // no share URL at all (offline/env-less/upload failure).
  async function share() {
    const blob = getBlob();
    if (!blob || shareBusy) return;
    setShareBusy(true);
    try {
      const target = await resolveShareTarget(blob);
      const file = new File([blob], `photobooth-${serial}.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.canShare?.({ files: [file] })) {
        const data: ShareData = { title: "Photobooth Passport", files: [file] };
        if (target) {
          data.url = target.url;
          data.text = `Admitted at ${booth.name} — No. ${serial}`;
        }
        try {
          await navigator.share(data);
        } catch {
          return; // user dismissed the sheet — no completion signal
        }
        signal("strip_shared");
        if (target) {
          signal("share_completed", {
            share_slug: target.slug,
            meta: { method: "web-share" },
          });
        }
        return;
      }
      if (target) {
        try {
          await writeClipboard(target.url);
          setLinkCopied(true);
          signal("strip_shared");
          signal("share_completed", {
            share_slug: target.slug,
            meta: { method: "copy-link" },
          });
          return;
        } catch {
          // clipboard permission denied (or never resolved) — fall through
          // to a plain download
        }
      }
      download();
    } finally {
      setShareBusy(false);
    }
  }

  async function copyLink() {
    const blob = getBlob();
    if (!blob || copyBusy) return;
    setCopyBusy(true);
    try {
      const target = await resolveShareTarget(blob);
      if (!target) return; // offline/env-less/upload failed — no link yet, no error UI
      try {
        await writeClipboard(target.url);
      } catch {
        return;
      }
      setLinkCopied(true);
      signal("share_completed", {
        share_slug: target.slug,
        meta: { method: "copy-link" },
      });
    } finally {
      setCopyBusy(false);
    }
  }

  async function shareStoryCard() {
    const blob = getBlob();
    if (!blob || cardBusy) return;
    setCardBusy(true);
    try {
      const target = await resolveShareTarget(blob);
      const card = await composeShareCard(blob, booth, serial, dateText, target?.url ?? null);
      signal("story_card_shared");
      const file = new File([card], `story-${serial}.jpg`, {
        type: "image/jpeg",
      });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          if (target) {
            signal("share_completed", {
              share_slug: target.slug,
              meta: { method: "web-share" },
            });
          }
        } catch {
          // user dismissed the sheet
        }
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
    <div className="relative flex min-h-dvh flex-col bg-cream px-5 pb-10 pt-safe-lg">
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
        <PlateButton onClick={share} disabled={shareBusy}>
          Share the strip
        </PlateButton>
        <div className="mt-2 text-center">
          <TypeLink onClick={copyLink} disabled={copyBusy}>
            COPY LINK
          </TypeLink>
        </div>
        {linkCopied && (
          <p className="mt-2 text-center font-geo text-[10px] tracking-[0.16em] text-gold">
            LINK COPIED — PASTE IT ANYWHERE.
          </p>
        )}
        <div className="mt-5 flex items-center justify-center gap-5">
          <TypeLink onClick={download}>DOWNLOAD</TypeLink>
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

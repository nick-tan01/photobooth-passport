"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { StripRecord } from "@/lib/types";
import { BOOTHS, getBooth } from "@/lib/booths";
import { listStrips, deleteStrip } from "@/lib/storage";
import { BoothStamp, EntryStamp } from "./Stamp";
import { PlateButton, TypeLink } from "./Controls";
import { PhotoCorners } from "./CustomizeStrip";
import PaperTexture from "./PaperTexture";

interface Item {
  rec: StripRecord;
  url: string;
}

export default function Passport({ onDirectory }: { onDirectory: () => void }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [page, setPage] = useState(0);
  const [voiding, setVoiding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const made: string[] = [];
    listStrips()
      .then((rs) => {
        if (cancelled) return;
        const its = rs.map((rec) => {
          const url = URL.createObjectURL(rec.image);
          made.push(url);
          return { rec, url };
        });
        setItems(its);
        setPage(Math.max(0, its.length - 1));
      })
      .catch(() => setItems([]));
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  async function voidRecord(item: Item) {
    await deleteStrip(item.rec.id).catch(() => {});
    setItems((prev) => {
      const next = (prev ?? []).filter((i) => i.rec.id !== item.rec.id);
      setPage((p) => Math.min(p, Math.max(0, next.length - 1)));
      return next;
    });
    setVoiding(false);
  }

  const collected = new Set((items ?? []).map((i) => i.rec.boothId));
  const current = items && items.length > 0 ? items[Math.min(page, items.length - 1)] : null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-manila px-5 pb-8 pt-7">
      <header className="relative z-10">
        <TypeLink onClick={onDirectory}>← BOOTHS</TypeLink>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <h1 className="font-caslon text-[27px] font-bold text-ink">
              Passport
            </h1>
            <p className="font-type text-[10px] tracking-[0.26em] text-faded">
              RECORDS OF MEMORY
            </p>
          </div>
          <div className="mb-1 flex items-center gap-2">
            {BOOTHS.map((b) =>
              collected.has(b.id) ? (
                <BoothStamp key={b.id} booth={b} className="w-10" />
              ) : (
                <div
                  key={b.id}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-dashed border-faded/70"
                  title={`${b.name} — not yet collected`}
                >
                  <span className="font-type text-[8.5px] text-faded">
                    {b.prefix}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>
        <div className="mt-2 border-t-2 border-ink" />
        <div className="mt-[3px] border-t border-ink/40" />
      </header>

      {/* the page */}
      <div className="relative z-10 mx-auto mt-5 w-full max-w-[340px]">
        <div className="relative min-h-[440px] border border-ink/25 border-l-2 border-l-ink/40 bg-manila-deep/45 px-6 pb-6 pt-7 [border-left-style:dashed]">
          {items === null && (
            <p className="soft-blink mt-24 text-center font-type text-[11px] tracking-[0.25em] text-faded">
              OPENING THE REGISTER…
            </p>
          )}

          {items !== null && !current && (
            <div className="flex flex-col items-center pt-10">
              <div className="flex h-[280px] w-[120px] items-center justify-center border-2 border-dashed border-faded/60">
                <span className="-rotate-90 whitespace-nowrap font-type text-[10px] tracking-[0.3em] text-faded">
                  STRIP GOES HERE
                </span>
              </div>
              <p className="mt-6 font-type text-[12px] tracking-[0.14em] text-ink-soft">
                NO RECORDS ON FILE.
              </p>
              <div className="mt-5 w-full max-w-[240px]">
                <PlateButton onClick={onDirectory}>Visit a booth</PlateButton>
              </div>
            </div>
          )}

          {current && (
            <div key={current.rec.id} className="screen-in">
              <div className="relative mx-auto w-fit rotate-[-0.7deg]">
                <img
                  src={current.url}
                  alt={`Photo strip ${current.rec.serial}`}
                  className="block w-auto shadow-strip"
                  style={{ height: "min(40dvh, 360px)" }}
                />
                <PhotoCorners />
                <div className="absolute -bottom-6 -right-12 w-[150px] rotate-[7deg]">
                  <EntryStamp
                    date={current.rec.dateText.toUpperCase()}
                    color={getBooth(current.rec.boothId).accent}
                  />
                </div>
              </div>
              <div className="mt-9 flex items-center justify-between">
                <span className="font-type text-[10.5px] tracking-[0.12em] text-ink-soft">
                  No. {current.rec.serial}
                </span>
                {voiding ? (
                  <span className="font-type text-[10.5px] text-stamp">
                    VOID THIS RECORD?{" "}
                    <button
                      className="underline underline-offset-2"
                      onClick={() => voidRecord(current)}
                    >
                      YES
                    </button>{" "}
                    ·{" "}
                    <button
                      className="underline underline-offset-2"
                      onClick={() => setVoiding(false)}
                    >
                      NO
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setVoiding(true)}
                    className="font-type text-[10px] tracking-[0.18em] text-faded underline underline-offset-2"
                  >
                    VOID
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* leaf navigation */}
      {items !== null && items.length > 0 && (
        <div className="relative z-10 mx-auto mt-4 flex w-full max-w-[340px] items-center justify-between">
          <TypeLink
            disabled={page === 0}
            onClick={() => {
              setVoiding(false);
              setPage((p) => Math.max(0, p - 1));
            }}
          >
            ‹ EARLIER
          </TypeLink>
          <span className="font-type text-[10.5px] tracking-[0.22em] text-faded">
            LEAF {Math.min(page, items.length - 1) + 1} OF {items.length}
          </span>
          <TypeLink
            disabled={page >= items.length - 1}
            onClick={() => {
              setVoiding(false);
              setPage((p) => Math.min(items.length - 1, p + 1));
            }}
          >
            LATER ›
          </TypeLink>
        </div>
      )}

      <PaperTexture />
    </div>
  );
}

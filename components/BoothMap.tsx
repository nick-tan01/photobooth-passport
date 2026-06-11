"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { Booth, StripRecord } from "@/lib/types";
import { PLACES } from "@/lib/booths";
import { listStrips } from "@/lib/storage";
import { BoothStamp } from "./Stamp";
import { TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

interface VisitInfo {
  count: number;
  latest: StripRecord;
  url: string;
}

const VB_W = 390;
const VB_H = 300;

// Simplified North America, drawn for Grand Tour cartography rather than
// accuracy. Coordinates match booths[].map (same viewBox).
const LAND =
  "M 48 60 L 70 48 L 96 44 L 140 40 L 188 38 L 232 42 L 262 50 L 248 64 L 252 82 L 266 88 L 282 74 L 304 70 L 314 84 L 300 100 L 308 112 L 296 122 Q 288 140 282 158 L 278 178 L 286 202 L 280 214 L 272 200 Q 256 192 238 196 L 218 200 Q 214 222 222 248 L 214 256 L 204 234 Q 196 214 186 202 L 178 224 L 170 220 L 162 196 Q 152 182 148 168 Q 138 138 128 110 L 116 94 L 98 86 L 78 82 L 58 76 L 42 68 Z";

// Decorative dashed route arcs between ports of call.
const ROUTES = [
  "M 236 112 Q 210 94 182 92",
  "M 182 92 Q 158 128 148 168",
  "M 236 112 Q 262 130 281 157",
  "M 148 168 Q 218 188 281 157",
  "M 236 112 Q 252 102 266 100",
];

export default function BoothMap({
  onBack,
  onEnterBooth,
  onOpenPassport,
}: {
  onBack: () => void;
  onEnterBooth: (b: Booth) => void;
  onOpenPassport: () => void;
}) {
  const [visits, setVisits] = useState<Record<string, VisitInfo> | null>(null);
  const [selected, setSelected] = useState<Booth | null>(null);

  useEffect(() => {
    let cancelled = false;
    const made: string[] = [];
    listStrips()
      .then((rs) => {
        if (cancelled) return;
        const map: Record<string, VisitInfo> = {};
        for (const rec of rs) {
          const existing = map[rec.boothId];
          if (existing) {
            existing.count += 1;
            existing.latest = rec; // list is ascending; later record wins
          } else {
            map[rec.boothId] = { count: 1, latest: rec, url: "" };
          }
        }
        for (const k of Object.keys(map)) {
          const u = URL.createObjectURL(map[k].latest.image);
          map[k].url = u;
          made.push(u);
        }
        setVisits(map);
      })
      .catch(() => setVisits({}));
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const visitedCount = visits
    ? PLACES.filter((p) => visits[p.id]).length
    : 0;

  return (
    <div className="relative flex min-h-dvh flex-col bg-cream px-5 pb-8 pt-7">
      <header className="relative z-10">
        <div className="flex items-center justify-between">
          <TypeLink onClick={onBack}>← BOOTHS</TypeLink>
          <TypeLink onClick={onOpenPassport}>PASSPORT →</TypeLink>
        </div>
        <h1 className="mt-3 font-display text-[27px] font-semibold text-ink">
          Route Map
        </h1>
        <p className="font-geo text-[9.5px] tracking-[0.26em] text-faded">
          THE GRAND TOUR COMPANY · PORTS OF CALL
        </p>
        <div className="mt-2 border-t-2 border-navy" />
        <div className="mt-[3px] border-t border-navy/40" />
      </header>

      <div
        className="relative z-10 mt-5 w-full"
        style={{ aspectRatio: `${VB_W}/${VB_H}` }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Stylized map of North America with booth locations"
        >
          <g stroke="#C9A86A" strokeWidth="0.6" opacity="0.45" fill="none">
            <path d="M 0 85 Q 195 62 390 85" />
            <path d="M 0 165 Q 195 142 390 165" />
            <path d="M 0 245 Q 195 222 390 245" />
          </g>
          <path
            d={LAND}
            fill="#F9F4E9"
            stroke="#1F3A5F"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M 226 118 q 8 -7 16 -3 q 9 4 16 1 q -2 9 -12 9 q -13 1 -20 -7 Z"
            fill="#F2ECDD"
            stroke="#1F3A5F"
            strokeWidth="1"
          />
          <g
            stroke="#1F3A5F"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.45"
            fill="none"
          >
            {ROUTES.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          <g transform="translate(348 52)">
            <circle r="10" fill="none" stroke="#C9A86A" strokeWidth="1" />
            <path d="M 0 -16 L 3 -4 L 0 0 L -3 -4 Z" fill="#C9A86A" />
            <path d="M 0 16 L 3 4 L 0 0 L -3 4 Z" fill="#C9A86A" opacity="0.5" />
            <path d="M -16 0 L -4 -3 L 0 0 L -4 3 Z" fill="#C9A86A" opacity="0.5" />
            <path d="M 16 0 L 4 -3 L 0 0 L 4 3 Z" fill="#C9A86A" opacity="0.5" />
          </g>
          <text
            x="58"
            y="228"
            fontFamily='"Playfair Display", Georgia, serif'
            fontStyle="italic"
            fontSize="11"
            fill="#8A7F6A"
            opacity="0.85"
          >
            Pacific
          </text>
          <text
            x="316"
            y="178"
            fontFamily='"Playfair Display", Georgia, serif'
            fontStyle="italic"
            fontSize="11"
            fill="#8A7F6A"
            opacity="0.85"
          >
            Atlantic
          </text>
        </svg>

        {PLACES.map((b) => {
          const v = visits?.[b.id];
          return (
            <button
              key={b.id}
              onClick={() => setSelected(b)}
              className="press absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((b.map?.x ?? 0) / VB_W) * 100}%`,
                top: `${((b.map?.y ?? 0) / VB_H) * 100}%`,
              }}
              aria-label={`${b.name} — ${v ? "visited" : "not yet collected"}`}
            >
              {v ? (
                <span
                  className={`relative block rounded-full bg-paper/90 shadow-strip ${
                    b.exclusive ? "border-2 border-gold p-[2px]" : ""
                  }`}
                >
                  <BoothStamp booth={b} className="w-11" />
                  {v.count > 1 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-signal font-geo text-[9px] font-semibold text-paper">
                      {v.count}
                    </span>
                  )}
                </span>
              ) : (
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-dashed bg-paper/70 ${
                    b.exclusive ? "border-gold" : "border-faded"
                  }`}
                >
                  <span className="font-geo text-[8px] tracking-wide text-faded">
                    {b.prefix}
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="relative z-10 mt-2 text-center font-geo text-[9.5px] tracking-[0.25em] text-faded">
        PORTS OF CALL · {visitedCount} OF {PLACES.length} VISITED
      </p>
      {!selected && (
        <p className="relative z-10 mt-1 text-center font-geo text-[8.5px] tracking-[0.2em] text-faded/80">
          TAP A PORT FOR ITS RECORD
        </p>
      )}

      {selected && (
        <div className="rise-in relative z-10 mx-auto mt-4 w-full max-w-[340px] border-2 border-navy bg-paper p-4 shadow-strip">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-3 top-2 font-geo text-[13px] text-faded"
            aria-label="Close booth details"
          >
            ✕
          </button>
          {(() => {
            const v = visits?.[selected.id];
            return (
              <div className="flex gap-4">
                {v ? (
                  <button onClick={onOpenPassport} className="shrink-0">
                    <img
                      src={v.url}
                      alt={`Latest strip from ${selected.name}`}
                      className="h-32 w-auto shadow-strip"
                    />
                  </button>
                ) : (
                  <div className="flex h-32 w-[42px] shrink-0 items-center justify-center border-[1.5px] border-dashed border-faded/70">
                    <span className="-rotate-90 whitespace-nowrap font-geo text-[7.5px] tracking-[0.2em] text-faded">
                      NO RECORD
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="font-display text-[18px] font-semibold text-ink">
                    {selected.name}
                  </h2>
                  <p className="font-geo text-[9px] tracking-[0.18em] text-faded">
                    {selected.place.toUpperCase()}
                  </p>
                  {v ? (
                    <>
                      <p className="mt-2 font-geo text-[11px] text-ink-soft">
                        {v.count} record{v.count > 1 ? "s" : ""} on file ·
                        latest No. {v.latest.serial}
                      </p>
                      <TypeLink onClick={onOpenPassport} className="mt-3">
                        OPEN PASSPORT →
                      </TypeLink>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 font-geo text-[11px] text-ink-soft">
                        Not yet collected.
                      </p>
                      <button
                        onClick={() => onEnterBooth(selected)}
                        className="press mt-3 border border-navy-deep bg-navy px-3 py-2 font-geo text-[10.5px] tracking-[0.18em] text-paper"
                      >
                        ENTER BOOTH →
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <PaperTexture />
    </div>
  );
}

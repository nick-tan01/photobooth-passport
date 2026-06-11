"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import type { Booth, StripRecord } from "@/lib/types";
import { PLACES } from "@/lib/booths";
import { MAP_W, MAP_H, LAND, GRATICULE, LAKES } from "@/lib/mapdata";
import { listStrips } from "@/lib/storage";
import { BoothStamp } from "./Stamp";
import { TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

interface VisitInfo {
  count: number;
  latest: StripRecord;
  url: string;
}

// Decorative dashed route arcs between pin positions.
const ROUTES = [
  "M 238 112 Q 222 116 210 134",
  "M 210 134 Q 168 158 140 196",
  "M 238 112 Q 262 150 268 196",
  "M 140 196 Q 205 218 268 196",
  "M 238 112 Q 268 112 293 128",
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
    <div className="relative flex min-h-dvh flex-col bg-cream px-5 pb-8 pt-safe">
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
        style={{ aspectRatio: `${MAP_W}/${MAP_H}` }}
      >
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Map of North America with booth locations"
        >
          <g stroke="#C9A86A" strokeWidth="0.5" opacity="0.45" fill="none">
            {GRATICULE.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {LAND.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#F9F4E9"
              stroke="#1F3A5F"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          ))}

          {LAKES.map((l, i) => (
            <ellipse
              key={i}
              cx={l.cx}
              cy={l.cy}
              rx={l.rx}
              ry={l.ry}
              transform={`rotate(${l.rot} ${l.cx} ${l.cy})`}
              fill="#F2ECDD"
              stroke="#1F3A5F"
              strokeWidth="0.8"
            />
          ))}

          <g
            stroke="#1F3A5F"
            strokeWidth="1.1"
            strokeDasharray="4 4"
            opacity="0.4"
            fill="none"
          >
            {ROUTES.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* callout leaders from true locations to offset pins */}
          {PLACES.filter((b) => b.map && b.mapTrue).map((b) => (
            <g key={`leader-${b.id}`}>
              <line
                x1={b.mapTrue!.x}
                y1={b.mapTrue!.y}
                x2={b.map!.x}
                y2={b.map!.y}
                stroke="#C9A86A"
                strokeWidth="1"
                strokeDasharray="2.5 2.5"
              />
              <circle
                cx={b.mapTrue!.x}
                cy={b.mapTrue!.y}
                r="2.4"
                fill="#1F3A5F"
              />
            </g>
          ))}

          <g transform="translate(350 48)">
            <circle r="10" fill="none" stroke="#C9A86A" strokeWidth="1" />
            <path d="M 0 -16 L 3 -4 L 0 0 L -3 -4 Z" fill="#C9A86A" />
            <path d="M 0 16 L 3 4 L 0 0 L -3 4 Z" fill="#C9A86A" opacity="0.5" />
            <path d="M -16 0 L -4 -3 L 0 0 L -4 3 Z" fill="#C9A86A" opacity="0.5" />
            <path d="M 16 0 L 4 -3 L 0 0 L 4 3 Z" fill="#C9A86A" opacity="0.5" />
          </g>
          <text
            x="58"
            y="242"
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
            y="232"
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
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${((b.map?.x ?? 0) / MAP_W) * 100}%`,
                top: `${((b.map?.y ?? 0) / MAP_H) * 100}%`,
              }}
              aria-label={`${b.name} — ${v ? "visited" : "not yet collected"}`}
            >
              {v ? (
                <span
                  className={`relative block rounded-full bg-paper/90 shadow-strip ${
                    b.exclusive ? "border-2 border-gold p-[2px]" : ""
                  }`}
                >
                  <BoothStamp booth={b} className="w-10" />
                  {v.count > 1 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-signal font-geo text-[9px] font-semibold text-paper">
                      {v.count}
                    </span>
                  )}
                </span>
              ) : (
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-dashed bg-paper/80 ${
                    b.exclusive ? "border-gold" : "border-faded"
                  }`}
                >
                  <span className="font-geo text-[7.5px] tracking-wide text-faded">
                    {b.prefix}
                  </span>
                </span>
              )}
            </button>
          );
        })}

        {selected && (
          <div className="rise-in absolute inset-x-0 -bottom-2 z-20 border-2 border-navy bg-paper p-4 shadow-strip">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-2 p-1 font-geo text-[13px] text-faded"
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
                        className="h-28 w-auto shadow-strip"
                      />
                    </button>
                  ) : (
                    <div className="flex h-28 w-[38px] shrink-0 items-center justify-center border-[1.5px] border-dashed border-faded/70">
                      <span className="-rotate-90 whitespace-nowrap font-geo text-[7.5px] tracking-[0.2em] text-faded">
                        NO RECORD
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-[17px] font-semibold text-ink">
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
                        <TypeLink onClick={onOpenPassport} className="mt-2">
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
                          className="press mt-2 border border-navy-deep bg-navy px-3 py-2 font-geo text-[10.5px] tracking-[0.18em] text-paper"
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
      </div>

      <p className="relative z-10 mt-3 text-center font-geo text-[9.5px] tracking-[0.25em] text-faded">
        PORTS OF CALL · {visitedCount} OF {PLACES.length} VISITED
      </p>
      {!selected && (
        <p className="relative z-10 mt-1 text-center font-geo text-[8.5px] tracking-[0.2em] text-faded/80">
          TAP A PORT FOR ITS RECORD
        </p>
      )}

      <PaperTexture />
    </div>
  );
}

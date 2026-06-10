"use client";

import type { Booth } from "@/lib/types";
import { FINISHES, type FinishId } from "@/lib/filters";
import { BoothStamp } from "./Stamp";
import { FormCheck, PlateButton, TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

interface Props {
  booth: Booth;
  serial: string;
  dateText: string;
  wantPrompts: boolean;
  setWantPrompts: (v: boolean) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  finish: FinishId;
  setFinish: (f: FinishId) => void;
  onBegin: () => void;
  onBack: () => void;
}

const CLAUSES = [
  "The sitting comprises FOUR (4) exposures, captured automatically on a timed sequence.",
  "ONE (1) amendment — a complete re-sitting — is permitted per record. Choose your moment.",
  "The apparatus requires your camera. Exposures never leave this device.",
];

export default function SessionIntro({
  booth,
  serial,
  dateText,
  wantPrompts,
  setWantPrompts,
  soundOn,
  setSoundOn,
  finish,
  setFinish,
  onBegin,
  onBack,
}: Props) {
  return (
    <div className="relative min-h-dvh bg-cream px-5 pb-10 pt-7">
      <div className="relative z-10">
        <TypeLink onClick={onBack}>← DIRECTORY</TypeLink>
      </div>

      <div className="relative z-10 mt-4 border-2 border-ink bg-paper px-5 pb-6 pt-5 shadow-strip">
        <div className="flex items-baseline justify-between">
          <p className="font-geo text-[10px] tracking-[0.26em] text-faded">
            SITTING CARD
          </p>
          <p className="font-geo text-[10px] tracking-[0.26em] text-faded">
            THE GRAND TOUR CO.
          </p>
        </div>
        <h1 className="mt-1 font-display text-[23px] font-bold text-ink">
          Record of Sitting
        </h1>
        <div className="mt-2 border-t-2 border-ink" />
        <div className="mt-[3px] border-t border-ink/40" />

        <dl className="mt-4 space-y-2 font-geo text-[13px]">
          <div className="flex gap-2">
            <dt className="w-[86px] shrink-0 text-[11px] tracking-[0.14em] text-faded">
              BOOTH
            </dt>
            <dd className="flex-1 border-b border-ink/35 pb-[2px] text-navy">
              {booth.name.toUpperCase()} — {booth.locale}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-[86px] shrink-0 text-[11px] tracking-[0.14em] text-faded">
              SERIAL No.
            </dt>
            <dd className="flex-1 border-b border-ink/35 pb-[2px] text-navy">
              {serial}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-[86px] shrink-0 text-[11px] tracking-[0.14em] text-faded">
              DATED
            </dt>
            <dd className="flex-1 border-b border-ink/35 pb-[2px] text-navy">
              {dateText}
            </dd>
          </div>
        </dl>

        <p className="mt-5 font-geo text-[9px] font-semibold tracking-[0.26em] text-gold">
          TERMS OF CARRIAGE
        </p>
        <ol className="mt-2 space-y-3">
          {CLAUSES.map((c, i) => (
            <li key={i} className="flex gap-3 font-geo text-[12.5px] leading-snug text-ink">
              <span className="shrink-0 font-semibold text-gold">{i + 1}.</span>
              <span>{c}</span>
            </li>
          ))}
        </ol>

        <p className="mt-5 font-geo text-[9px] font-semibold tracking-[0.26em] text-gold">
          FINISH — CHOOSE ONE
        </p>
        <div
          className="mt-2 grid grid-cols-2 gap-2"
          role="radiogroup"
          aria-label="Print finish"
        >
          {FINISHES.map((f) => {
            const active = finish === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFinish(f.id)}
                role="radio"
                aria-checked={active}
                className={`press flex items-center gap-2.5 px-2.5 py-2 text-left ${
                  active
                    ? "border-[1.5px] border-navy bg-navy/[0.06]"
                    : "border border-ink/30"
                }`}
              >
                <span
                  aria-hidden
                  className="h-6 w-6 shrink-0 rounded-full border border-ink/25"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 30%, #E8C49A 0%, #C98E6B 38%, #8A5E48 62%, #1F3A5F 100%)",
                    filter: f.css,
                  }}
                />
                <span className="min-w-0">
                  <span className="block font-geo text-[11px] font-semibold tracking-[0.1em] text-ink">
                    {f.name}
                  </span>
                  <span className="block font-geo text-[8.5px] leading-tight text-faded">
                    {f.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3 border-t border-dashed border-ink/40 pt-4">
          <FormCheck
            checked={wantPrompts}
            onChange={setWantPrompts}
            label="POSE DIRECTIONS, PLEASE"
            sub="A small slip will suggest each pose."
          />
          <FormCheck
            checked={soundOn}
            onChange={setSoundOn}
            label="APPARATUS SOUNDS"
            sub="Stamps, shutters and motors."
          />
        </div>

        <div className="pointer-events-none absolute bottom-2 right-2 w-[92px] rotate-[10deg] opacity-[0.13]">
          <BoothStamp booth={booth} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-6 max-w-[330px]">
        <PlateButton onClick={onBegin}>Begin the sitting</PlateButton>
        <p className="mt-3 text-center font-geo text-[10.5px] tracking-[0.22em] text-faded">
          THE COUNTDOWN BEGINS AT ONCE
        </p>
      </div>

      <PaperTexture />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { Booth } from "@/lib/types";
import { haversineKm, presenceVerified, markPresenceVerified } from "@/lib/geo";
import { signal } from "@/lib/signals";
import { BoothStamp } from "./Stamp";
import { FormCheck, PlateButton, TypeLink } from "./Controls";
import PaperTexture from "./PaperTexture";

type Presence = "required" | "checking" | "granted" | "far" | "refused";

interface Props {
  booth: Booth;
  serial: string;
  dateText: string;
  wantPrompts: boolean;
  setWantPrompts: (v: boolean) => void;
  soundOn: boolean;
  setSoundOn: (v: boolean) => void;
  onBegin: () => void;
  onBack: () => void;
  // True only for the single SessionIntro reached straight from a shared
  // strip's /s/[slug] CTA (see DESIGN.md "Referred first-run") — a normal
  // directory-selected visit is always false.
  referred?: boolean;
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
  onBegin,
  onBack,
  referred,
}: Props) {
  const geo = booth.exclusive?.geo;
  const [presence, setPresence] = useState<Presence>(
    geo ? "required" : "granted",
  );
  const [distKm, setDistKm] = useState<number | null>(null);

  useEffect(() => {
    if (geo && presenceVerified(booth.id)) setPresence("granted");
  }, [booth.id, geo]);

  function verifyPresence() {
    if (!geo) return;
    if (!navigator.geolocation) {
      setPresence("refused");
      return;
    }
    setPresence("checking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineKm(
          pos.coords.latitude,
          pos.coords.longitude,
          geo.lat,
          geo.lng,
        );
        setDistKm(d);
        if (d <= geo.radiusKm) {
          markPresenceVerified(booth.id);
          signal("presence_verified");
          setPresence("granted");
        } else {
          setPresence("far");
        }
      },
      () => setPresence("refused"),
      { timeout: 9000, maximumAge: 60000 },
    );
  }

  return (
    <div className="relative min-h-dvh bg-cream px-5 pb-10 pt-safe">
      {referred ? (
        <div className="relative z-10 text-center">
          <p className="font-geo text-[10px] tracking-[0.22em] text-gold">
            ADMITTED ON THE RECOMMENDATION OF A FELLOW TRAVELLER
          </p>
          <div className="mt-2">
            <TypeLink onClick={onBack}>SEE EVERY BOOTH →</TypeLink>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <TypeLink onClick={onBack}>← DIRECTORY</TypeLink>
        </div>
      )}

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

      {presence === "granted" ? (
        <div className="relative z-10 mx-auto mt-6 max-w-[330px]">
          <PlateButton onClick={onBegin}>Begin the sitting</PlateButton>
          <p className="mt-3 text-center font-geo text-[10.5px] tracking-[0.22em] text-faded">
            THE COUNTDOWN BEGINS AT ONCE
          </p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto mt-6 max-w-[330px] border-2 border-navy bg-paper px-4 py-4 shadow-strip">
          <p className="font-geo text-[10px] font-semibold tracking-[0.24em] text-gold">
            PRESENCE CHECK
          </p>
          <p className="mt-2 font-geo text-[12.5px] leading-snug text-ink">
            This booth issues only at {booth.exclusive?.place}.
          </p>
          {presence === "far" && distKm !== null && (
            <p className="mt-2 font-geo text-[11px] text-signal">
              You appear to be {Math.round(distKm)} km from the falls.
            </p>
          )}
          {presence === "refused" && (
            <p className="mt-2 font-geo text-[11px] text-signal">
              The atlas was refused — allow location access and try again.
            </p>
          )}
          <div className="mt-4">
            <PlateButton
              onClick={verifyPresence}
              disabled={presence === "checking"}
            >
              {presence === "checking" ? "Consulting the atlas…" : "Verify presence"}
            </PlateButton>
            <div className="mt-3 text-center">
              <TypeLink
                onClick={() => {
                  setPresence("granted");
                }}
              >
                SIMULATE ARRIVAL — DEMONSTRATION ONLY
              </TypeLink>
            </div>
          </div>
        </div>
      )}

      <PaperTexture />
    </div>
  );
}

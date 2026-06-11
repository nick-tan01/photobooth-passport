"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Booth, StripRecord, View } from "@/lib/types";
import type { FinishId } from "@/lib/filters";
import { compositeStrip, ensureFonts } from "@/lib/composite";
import { nextSerial, saveStrip } from "@/lib/storage";
import { isMuted, setMuted } from "@/lib/audio";
import { signal } from "@/lib/signals";
import Cover from "@/components/Cover";
import BoothDirectory from "@/components/BoothDirectory";
import SessionIntro from "@/components/SessionIntro";
import CaptureBooth from "@/components/CaptureBooth";
import StripReveal from "@/components/StripReveal";
import CustomizeStrip from "@/components/CustomizeStrip";
import Admitted from "@/components/Admitted";
import Passport from "@/components/Passport";
import BoothMap from "@/components/BoothMap";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatToday(): string {
  const d = new Date();
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export default function Home() {
  const [view, setView] = useState<View>("cover");
  const [booth, setBooth] = useState<Booth | null>(null);
  const [serial, setSerial] = useState("");
  const [wantPrompts, setWantPrompts] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [finish, setFinish] = useState<FinishId>("gloss");
  const [photos, setPhotos] = useState<string[]>([]);
  const [retakeUsed, setRetakeUsed] = useState(false);
  const [caption, setCaption] = useState("");
  const [dateText, setDateText] = useState("");
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const stripBlob = useRef<Blob | null>(null);
  const compositeSeq = useRef(0);

  useEffect(() => {
    setSoundOn(!isMuted());
    ensureFonts();
  }, []);

  useEffect(
    () => () => {
      if (stripUrl) URL.revokeObjectURL(stripUrl);
    },
    [stripUrl],
  );

  const recompose = useCallback(
    async (
      cap: string,
      date: string,
      ph: string[],
      b: Booth,
      ser: string,
      fin: FinishId,
    ) => {
      const seq = ++compositeSeq.current;
      try {
        const blob = await compositeStrip({
          photos: ph,
          booth: b,
          caption: cap,
          dateText: date,
          serial: ser,
          finish: fin,
        });
        if (seq !== compositeSeq.current) return;
        stripBlob.current = blob;
        setStripUrl(URL.createObjectURL(blob));
      } catch {
        // leave the previous strip in place
      }
    },
    [],
  );

  function selectBooth(b: Booth) {
    setBooth(b);
    setSerial(nextSerial(b.prefix));
    setRetakeUsed(false);
    setCaption("");
    setDateText(formatToday());
    setPhotos([]);
    stripBlob.current = null;
    setStripUrl(null);
    setView("intro");
  }

  function beginSitting() {
    setPhotos([]);
    setStripUrl(null);
    signal("sitting_started");
    setView("capture");
  }

  function onCaptured(shots: string[]) {
    setPhotos(shots);
    setStripUrl(null);
    signal("sitting_completed");
    setView("reveal");
    if (booth) recompose(caption, dateText, shots, booth, serial, finish);
  }

  function amend() {
    setRetakeUsed(true);
    setPhotos([]);
    setStripUrl(null);
    setView("capture");
  }

  async function affix() {
    if (!booth || !stripBlob.current) return;
    const rec: StripRecord = {
      id: uuid(),
      boothId: booth.id,
      image: stripBlob.current,
      caption,
      dateText,
      serial,
      createdAt: Date.now(),
    };
    try {
      await saveStrip(rec);
    } catch {
      // storage may be unavailable (private browsing); still show the stamp
    }
    signal("strip_affixed");
    setView("admitted");
  }

  function setSound(v: boolean) {
    setSoundOn(v);
    setMuted(!v);
  }

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-app overflow-x-hidden bg-cream shadow-[0_0_60px_rgba(0,0,0,0.55)]">
      <div key={view} className="screen-in">
        {view === "cover" && <Cover onOpen={() => setView("directory")} />}

        {view === "directory" && (
          <BoothDirectory
            onSelect={selectBooth}
            onPassport={() => setView("passport")}
            onMap={() => setView("map")}
          />
        )}

        {view === "intro" && booth && (
          <SessionIntro
            booth={booth}
            serial={serial}
            dateText={dateText}
            wantPrompts={wantPrompts}
            setWantPrompts={setWantPrompts}
            soundOn={soundOn}
            setSoundOn={setSound}
            onBegin={beginSitting}
            onBack={() => setView("directory")}
          />
        )}

        {view === "capture" && booth && (
          <CaptureBooth
            booth={booth}
            wantPrompts={wantPrompts}
            amendment={retakeUsed}
            onComplete={onCaptured}
            onAbort={() => setView("intro")}
          />
        )}

        {view === "reveal" && (
          <StripReveal
            stripUrl={stripUrl}
            retakeUsed={retakeUsed}
            onAmend={amend}
            onProceed={() => setView("customize")}
          />
        )}

        {view === "customize" && booth && (
          <CustomizeStrip
            stripUrl={stripUrl}
            caption={caption}
            dateText={dateText}
            finish={finish}
            onCaption={setCaption}
            onDate={setDateText}
            onFinish={(f) => {
              setFinish(f);
              recompose(caption, dateText, photos, booth, serial, f);
            }}
            recompose={(c, d) => recompose(c, d, photos, booth, serial, finish)}
            onAffix={affix}
          />
        )}

        {view === "admitted" && booth && (
          <Admitted
            booth={booth}
            serial={serial}
            dateText={dateText}
            stripUrl={stripUrl}
            getBlob={() => stripBlob.current}
            onPassport={() => setView("passport")}
            onDirectory={() => setView("directory")}
          />
        )}

        {view === "passport" && (
          <Passport
            onDirectory={() => setView("directory")}
            onMap={() => setView("map")}
          />
        )}

        {view === "map" && (
          <BoothMap
            onBack={() => setView("directory")}
            onEnterBooth={selectBooth}
            onOpenPassport={() => setView("passport")}
          />
        )}
      </div>
    </main>
  );
}

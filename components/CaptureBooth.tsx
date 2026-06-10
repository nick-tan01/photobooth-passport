"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Booth } from "@/lib/types";
import {
  startCamera,
  stopStream,
  captureFrame,
  captureTestFrame,
} from "@/lib/camera";
import { getFinish, type FinishId } from "@/lib/filters";
import { ensureFonts } from "@/lib/composite";
import { playThunk, playShutter, buzz } from "@/lib/audio";

type Phase = "warming" | "denied" | "running" | "done";

interface Props {
  booth: Booth;
  wantPrompts: boolean;
  amendment: boolean;
  finish: FinishId;
  onComplete: (photos: string[]) => void;
  onAbort: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function CaptureBooth({
  booth,
  wantPrompts,
  amendment,
  finish,
  onComplete,
  onAbort,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);
  const startedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("warming");
  const [demo, setDemo] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [exposure, setExposure] = useState(0);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const promptOffset = useMemo(
    () => Math.floor(Math.random() * booth.prompts.length),
    [booth],
  );

  const runSequence = useCallback(
    async (useDemo: boolean) => {
      if (startedRef.current) return;
      startedRef.current = true;
      setPhase("running");
      const shots: string[] = [];
      await sleep(700);
      for (let i = 0; i < 4; i++) {
        if (!aliveRef.current) return;
        setExposure(i);
        setPrompt(
          wantPrompts
            ? booth.prompts[(promptOffset + i) % booth.prompts.length]
            : null,
        );
        for (let n = 3; n >= 1; n--) {
          if (!aliveRef.current) return;
          setCount(n);
          playThunk();
          await sleep(950);
        }
        setCount(null);
        if (!aliveRef.current) return;
        const shot =
          useDemo || !videoRef.current
            ? captureTestFrame(i, booth.accent, finish)
            : captureFrame(videoRef.current, finish);
        shots.push(shot);
        setThumbs([...shots]);
        setFlash(true);
        playShutter();
        buzz(35);
        await sleep(430);
        setFlash(false);
        await sleep(750);
      }
      if (!aliveRef.current) return;
      setPhase("done");
      setPrompt(null);
      stopStream(streamRef.current);
      streamRef.current = null;
      await sleep(600);
      if (aliveRef.current) onComplete(shots);
    },
    [booth, wantPrompts, promptOffset, finish, onComplete],
  );

  useEffect(() => {
    aliveRef.current = true;
    ensureFonts();
    let cancelled = false;
    (async () => {
      try {
        const stream = await startCamera();
        if (cancelled) {
          stopStream(stream);
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        runSequence(false);
      } catch {
        if (!cancelled) setPhase("denied");
      }
    })();
    return () => {
      cancelled = true;
      aliveRef.current = false;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const demoCard = useMemo(
    () => (demo ? captureTestFrame(exposure, booth.accent, finish, 480) : null),
    [demo, exposure, booth, finish],
  );

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-booth px-6 pb-8">
      <svg
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-0 w-full"
        viewBox="0 0 390 26"
        preserveAspectRatio="none"
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <circle key={i} cx={19.5 + i * 39} cy="0" r="25" fill="#14243A" />
        ))}
      </svg>

      <div className="relative z-10 flex items-center justify-between pt-9">
        <button
          onClick={onAbort}
          className="font-geo text-[11px] tracking-[0.2em] text-paper/60"
        >
          ← ABANDON
        </button>
        <span className="font-geo text-[11px] tracking-[0.2em] text-paper/60">
          {amendment ? "AMENDMENT SITTING" : "SITTING IN PROGRESS"}
        </span>
      </div>

      <div className="relative z-10 mt-4 flex h-[56px] items-center justify-center">
        {prompt && phase === "running" && (
          <div
            key={prompt}
            className="slip-drop bg-paper px-4 py-2 shadow-strip"
            style={
              {
                "--slip-rot": exposure % 2 ? "1.3deg" : "-1.6deg",
              } as React.CSSProperties
            }
          >
            <span className="font-geo text-[13px] tracking-[0.08em] text-ink">
              {prompt}
            </span>
          </div>
        )}
        {!prompt && phase === "running" && (
          <span className="font-geo text-[10.5px] tracking-[0.28em] text-paper/40">
            HOLD STILL BETWEEN FLASHES
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-center pb-4">
      <div className="relative mx-auto mt-2 w-full max-w-[330px]">
        <div className="relative border-[10px] border-[#EDE5D0] bg-black shadow-strip">
          <div className="relative aspect-square overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              style={{
                display: demo ? "none" : undefined,
                filter: getFinish(finish).css,
              }}
            />
            {demo && demoCard && (
              <img
                src={demoCard}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {phase === "warming" && (
              <div className="absolute inset-0 flex items-center justify-center bg-booth">
                <span className="soft-blink font-geo text-[12px] tracking-[0.3em] text-paper/70">
                  WARMING THE APPARATUS…
                </span>
              </div>
            )}

            {phase === "denied" && !demo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-booth px-6 text-center">
                <span className="font-geo text-[12px] leading-relaxed tracking-wide text-paper/85">
                  THE APPARATUS CANNOT REACH A CAMERA.
                </span>
                <button
                  onClick={() => {
                    setDemo(true);
                    runSequence(true);
                  }}
                  className="press border border-paper/70 px-4 py-2 font-geo text-[12px] tracking-[0.18em] text-paper"
                >
                  PROCEED WITH TEST PATTERN →
                </button>
                <span className="font-geo text-[10px] leading-relaxed text-paper/50">
                  Allow camera access and re-enter the booth for real
                  exposures.
                </span>
              </div>
            )}

            {count !== null && (
              <div
                key={`${exposure}-${count}`}
                className="thunk-in absolute inset-0 flex items-center justify-center"
                style={
                  {
                    "--thunk-rot": count % 2 ? "-4deg" : "3deg",
                  } as React.CSSProperties
                }
              >
                <span className="font-display text-[120px] font-bold text-paper [text-shadow:0_3px_0_rgba(0,0,0,0.45)]">
                  {count}
                </span>
              </div>
            )}

            {flash && <div className="flash-out absolute inset-0 bg-[#FFF8E7]" />}
          </div>
        </div>

        <div className="mx-auto -mt-[2px] w-fit border border-[#A8854B] bg-gold px-3 py-[3px] shadow-plate">
          <span className="font-geo text-[9.5px] tracking-[0.26em] text-navy-deep">
            LOOK INTO THE GLASS · KEEP STILL
          </span>
        </div>
      </div>

      <div className="relative mx-auto mt-8 flex flex-col items-center gap-3">
        <span
          className={`font-geo text-[12px] tracking-[0.3em] text-paper/80 ${phase === "done" ? "soft-blink" : ""}`}
        >
          {phase === "done"
            ? "DEVELOPING…"
            : `EXPOSURE ${Math.min(exposure + 1, 4)} OF 4`}
        </span>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-12 border border-paper/40 bg-black/40">
              {thumbs[i] && (
                <img
                  src={thumbs[i]}
                  alt={`Exposure ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

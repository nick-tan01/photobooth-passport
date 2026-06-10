"use client";

import { useId, useMemo } from "react";
import type { Booth, BoothId } from "@/lib/types";
import { buildBoothStampSvg, buildEntryStampSvg } from "@/lib/stamp";

export function SealStamp({
  top,
  bottom,
  glyph,
  color,
  className,
  style,
}: {
  top: string;
  bottom: string;
  glyph: BoothId;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useMemo(
    () => buildBoothStampSvg({ top, bottom, glyph, color }, uid),
    [top, bottom, glyph, color, uid],
  );
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function BoothStamp({
  booth,
  color,
  className,
  style,
}: {
  booth: Booth;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <SealStamp
      top={booth.name.toUpperCase()}
      bottom={booth.stampLocale}
      glyph={booth.id}
      color={color ?? booth.accent}
      className={className}
      style={style}
    />
  );
}

export function EntryStamp({
  word = "ADMITTED",
  date,
  color = "#A33B2E",
  className,
  style,
}: {
  word?: string;
  date: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svg = useMemo(
    () => buildEntryStampSvg({ word, date, color }, uid),
    [word, date, color, uid],
  );
  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

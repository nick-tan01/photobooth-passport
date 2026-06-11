export type GlyphId =
  | "camera"
  | "moon"
  | "waves"
  | "falls"
  | "fleur"
  | "bunting"
  | "snow";

export type BoothKind = "place" | "seasonal" | "charter";

export interface Booth {
  id: string;
  kind: BoothKind;
  glyph: GlyphId;
  name: string;
  locale: string;
  stampLocale: string;
  motto: string;
  tagline: string;
  place: string;
  prefix: string;
  accent: string;
  paper: string;
  // pin position on the Route Map, in map SVG viewBox coordinates
  // (390 x 300); only kind "place" booths appear on the map
  map?: { x: number; y: number };
  // when the pin is offset for legibility, the true projected location —
  // drawn as a dot with a leader line to the pin
  mapTrue?: { x: number; y: number };
  // seasonal booths only issue during these months (0-11)
  season?: { months: number[]; returns: string };
  exclusive?: {
    place: string;
    note: string;
    // when present, the Sitting Card verifies presence by geolocation
    geo?: { lat: number; lng: number; radiusKm: number };
  };
  prompts: string[];
}

// a private event booth, unlocked by booking reference
export interface Charter extends Booth {
  code: string;
}

export interface StripRecord {
  id: string;
  boothId: string;
  image: Blob;
  caption: string;
  dateText: string;
  serial: string;
  createdAt: number;
}

export type View =
  | "cover"
  | "directory"
  | "intro"
  | "capture"
  | "reveal"
  | "customize"
  | "admitted"
  | "passport"
  | "map";

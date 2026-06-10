export type BoothId = "standard" | "midnight" | "seaside" | "niagara";

export interface Booth {
  id: BoothId;
  name: string;
  locale: string;
  stampLocale: string;
  tagline: string;
  prefix: string;
  accent: string;
  paper: string;
  exclusive?: { place: string; note: string };
  prompts: string[];
}

export interface StripRecord {
  id: string;
  boothId: BoothId;
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
  | "passport";

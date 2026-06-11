export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const KEY_PREFIX = "pp-presence-";

export function presenceVerified(boothId: string): boolean {
  try {
    return localStorage.getItem(KEY_PREFIX + boothId) === "1";
  } catch {
    return false;
  }
}

export function markPresenceVerified(boothId: string) {
  try {
    localStorage.setItem(KEY_PREFIX + boothId, "1");
  } catch {
    // best effort
  }
}

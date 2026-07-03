// Base62 share-slug generator — 8 chars, crypto-random, no external dep.
// See DESIGN.md "New-surface specs > /s/[slug]": 8 chars is enough
// collision space (~2.1e14 combinations) that retry-on-conflict on insert
// is sufficient; no ambiguous-character filtering is needed at this length.
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 8;

export function generateSlug(length = SLUG_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    // 256 % 62 leaves a very slight bias toward the first 8 alphabet
    // characters — negligible for a uniqueness token that already retries
    // on conflict, and not worth pulling in a rejection-sampling dep for.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

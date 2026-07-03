/** @type {import('next').NextConfig} */

// Supabase project origin, derived from env at config-evaluation time. A
// missing/empty/malformed env var yields null so the env-less build stays
// identical to today (no extra CSP tokens, never throws).
function supabaseOrigin() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}
const supaOrigin = supabaseOrigin();
const supaWs = supaOrigin ? `wss://${new URL(supaOrigin).host}` : null;

// Content-Security-Policy tuned to what this app actually loads:
//   - Google Fonts stylesheet (fonts.googleapis.com) + font files (fonts.gstatic.com)
//   - camera frames / composited strips as data: and blob: images
//   - the Supabase Storage origin (public strip images) and Supabase REST/
//     realtime endpoints (browser-side auth/storage calls, websockets)
//   - the same-origin service worker (worker-src) and /api/signal beacon (connect-src)
// 'unsafe-inline' is required for Next's hydration bootstrap and inline styles.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob:${supaOrigin ? ` ${supaOrigin}` : ""}`,
  "media-src 'self' blob:",
  `connect-src 'self'${supaOrigin ? ` ${supaOrigin} ${supaWs}` : ""}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

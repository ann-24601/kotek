/** @type {import('next').NextConfig} */

// Domeny, z którymi łączy się klient (Supabase REST/Storage/Auth/Realtime, PostHog).
const SUPABASE = "https://iythcbjjzwalyftxwswo.supabase.co";
const SUPABASE_WS = "wss://iythcbjjzwalyftxwswo.supabase.co";
const POSTHOG = "https://eu.i.posthog.com";
const POSTHOG_ASSETS = "https://eu-assets.i.posthog.com";

/*
  Content-Security-Policy — świadomie z 'unsafe-inline'/'unsafe-eval' dla script-src,
  bo Next.js (App Router) i PostHog wstrzykują inline/eval bootstrap. To wciąż zawęża
  connect-src / img-src / frame-ancestors / object-src, czyli realnie ogranicza
  eksfiltrację i clickjacking. Docelowe zaostrzenie: nonce dla skryptów.
*/
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${POSTHOG_ASSETS}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${SUPABASE}`,
  "font-src 'self' data:",
  `connect-src 'self' ${SUPABASE} ${SUPABASE_WS} ${POSTHOG} ${POSTHOG_ASSETS}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Anty-clickjacking (podwójnie z frame-ancestors, dla starszych przeglądarek).
  { key: "X-Frame-Options", value: "DENY" },
  // Blokada MIME-sniffingu.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nie wysyłaj pełnego URL-a jako referer poza własną domenę.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Wymuś HTTPS na 2 lata (z subdomenami). Vercel i tak serwuje po HTTPS.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Wyłącz nieużywane, wrażliwe API przeglądarki.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

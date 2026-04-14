/** Default HTTP API port (Rust backend). Kept away from common 3000/3001 stacks. */
export const DEFAULT_API_PORT = 3841;

/** Strip accidental quotes from .env copy-paste: `"http://127.0.0.1:3841"` */
function stripEnvQuotes(raw: string): string {
  let t = raw.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/** Ensure absolute URL has a scheme (WebKit rejects host-only strings in fetch). */
function normalizeHttpOrigin(raw: string): string {
  const t = stripEnvQuotes(raw);
  if (!t) return t;
  if (!/^https?:\/\//i.test(t)) {
    return `http://${t}`;
  }
  return t;
}

/**
 * Next.js dev on loopback: API goes through same-origin proxy (next.config rewrites).
 * Use full `http://localhost:3840/api/...` instead of path-only `/api/...` — WKWebView
 * often throws "The string did not match the expected pattern" on relative fetch URLs.
 */
function shouldUseNextProxy(): boolean {
  if (typeof window === "undefined") return false;
  const { protocol, hostname } = window.location;
  if (protocol !== "http:" && protocol !== "https:") return false;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * API base path, e.g. `http://localhost:3840/api` or `http://127.0.0.1:3841/api`.
 *
 * `NEXT_PUBLIC_API_BASE_URL`: if set, always used (no dev proxy).
 */
export function getApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (env) {
    const normalized = normalizeHttpOrigin(env).replace(/\/$/, "");
    if (/\/api$/i.test(normalized)) {
      return normalized;
    }
    return `${normalized}/api`;
  }

  if (shouldUseNextProxy() && typeof window !== "undefined") {
    const { origin } = window.location;
    if (origin && /^https?:\/\//i.test(origin)) {
      return `${origin}/api`;
    }
  }

  return `http://127.0.0.1:${DEFAULT_API_PORT}/api`;
}

/**
 * Full URL for one API path (no leading slash), e.g. `buildApiUrl("keys/create")`.
 */
export function buildApiUrl(path: string): string {
  const p = path.replace(/^\//, "");
  const base = getApiBaseUrl().replace(/\/$/, "");
  return `${base}/${p}`;
}

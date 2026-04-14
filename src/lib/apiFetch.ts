import { invoke } from "@tauri-apps/api/core";
import { buildApiUrl } from "@/lib/api";

/**
 * `isTauri()` from `@tauri-apps/api/core` only checks `window.isTauri`, which Tauri 2 does not always set.
 * The injected bridge is `window.__TAURI_INTERNALS__` — without this we fell through to `fetch()` and the
 * UI looked "dead" (hung or no feedback).
 */
function isTauriWebview(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Same as `fetch(buildApiUrl(path), init)` in the browser.
 * In Tauri, calls Rust `proxy_api_request` (reqwest) so the WebView never runs `fetch` to `/api` or `127.0.0.1`
 * (avoids WKWebView "The string did not match the expected pattern" / Load failed).
 */
export async function apiFetch(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const cleanPath = path.replace(/^\//, "");

  if (isTauriWebview()) {
    let bodyStr: string | null = null;
    if (init.body != null) {
      if (typeof init.body === "string") {
        bodyStr = init.body;
      } else {
        bodyStr = await new Response(init.body).text();
      }
    }
    const result = await invoke<{ status: number; body: string }>(
      "proxy_api_request",
      {
        method: init.method ?? "GET",
        path: cleanPath,
        body: bodyStr,
      },
    );
    return new Response(result.body, { status: result.status });
  }

  return fetch(buildApiUrl(cleanPath), init);
}

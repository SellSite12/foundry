"use client";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Thin fetch wrapper for Foundry API routes. Always resolves (never throws)
 * so callers can render errors inline.
 */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: options.method ?? "GET",
      headers:
        options.body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const json = await res.json().catch(() => null);
    if (json && typeof json === "object" && "ok" in json) {
      return json as ApiResult<T>;
    }
    return { ok: false, error: `Unexpected response (${res.status})` };
  } catch {
    return { ok: false, error: "Network error. Check your connection." };
  }
}

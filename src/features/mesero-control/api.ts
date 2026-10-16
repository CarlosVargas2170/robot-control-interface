import type { ApiResult } from "./types";

const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function responseError(data: unknown, status: number): string {
  if (typeof data === "string" && data.trim()) return data.trim().slice(0, 400);
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      if (typeof record[key] === "string" && record[key]) return record[key].slice(0, 400);
    }
  }
  return `HTTP ${status}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function meseroRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(new DOMException("Tiempo de espera agotado", "TimeoutError")),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  const abortFromExternal = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", abortFromExternal, { once: true });

  try {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, "");
    const request: RequestInit = {
      method: options.method ?? "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    };
    if (options.body !== undefined) {
      (request.headers as Record<string, string>)["Content-Type"] = "application/json";
      request.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${normalizedBaseUrl}${path}`, request);
    const data = await parseResponse(response);
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: data as T,
        error: responseError(data, response.status),
      };
    }
    return { ok: true, status: response.status, data: data as T };
  } catch (error) {
    const aborted = controller.signal.aborted;
    const message = error instanceof Error ? error.message : "Error de red";
    return {
      ok: false,
      aborted,
      error: aborted && !options.signal?.aborted ? "Tiempo de espera agotado" : message,
    };
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromExternal);
  }
}

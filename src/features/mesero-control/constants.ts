import type { MeseroOption, PaymentPollingStatus } from "./types";

export const MESERO_URL_STORAGE_KEY = "mesero-control:base-url";
export const MESERO_TTS_SESSION_KEY = "mesero-control:tts-token";
export const PAYMENT_POLL_INTERVAL_MS = 2_000;

const DEFAULT_MESERO_OPTIONS: readonly MeseroOption[] = [
  { id: "mesero-1", label: "Mesero 1", url: "http://100.99.244.72:5050" },
  { id: "mesero-2", label: "Mesero 2", url: "http://100.105.14.4:5050" },
  { id: "mesero-3", label: "Mesero 3", url: "http://100.113.184.85:5050" },
  { id: "mesero-4", label: "Mesero 4", url: "http://100.116.45.43:5050" },
  { id: "local", label: "Local", url: "http://localhost:5050" },
] as const;

function parseConfiguredOptions(raw: string | undefined): MeseroOption[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const ids = new Set<string>();
    const urls = new Set<string>();
    const options: MeseroOption[] = [];

    parsed.forEach((item, index) => {
      if (typeof item !== "object" || item === null) return;
      const record = item as Record<string, unknown>;
      if (typeof record.label !== "string" || typeof record.url !== "string") return;
      try {
        const parsedUrl = new URL(record.url);
        const hasUnsupportedParts =
          (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
          parsedUrl.username !== "" ||
          parsedUrl.password !== "" ||
          parsedUrl.pathname !== "/" ||
          parsedUrl.search !== "" ||
          parsedUrl.hash !== "";
        if (hasUnsupportedParts) return;

        const id = typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `configured-${index + 1}`;
        const label = record.label.trim();
        const normalizedUrl = parsedUrl.origin;
        if (!label || ids.has(id) || urls.has(normalizedUrl)) return;

        ids.add(id);
        urls.add(normalizedUrl);
        options.push({ id, label, url: normalizedUrl });
      } catch {
        // Ignorar entradas que no sean URLs absolutas HTTP(S) válidas.
      }
    });
    return options.length > 0 ? options : null;
  } catch {
    return null;
  }
}

export const MESERO_OPTIONS: readonly MeseroOption[] =
  parseConfiguredOptions(import.meta.env.VITE_MESERO_CONTROL_URLS) ?? DEFAULT_MESERO_OPTIONS;

export const EMPTY_PAYMENT_STATUS: PaymentPollingStatus = {
  phase: "idle",
  isPolling: false,
  label: "Polling detenido",
  counter: {
    totalSales: 0,
    totalAmount: 0,
    byProduct: [],
    recent: [],
  },
};

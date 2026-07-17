// ─── useCameras ───────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import type { CameraInfo } from "../types/camera";
import { MOCK_MODE, MOCK_CAMERAS } from "../config/backend";

/**
 * Fetches the list of available cameras from the backend.
 *
 * When `MOCK_MODE` is enabled in `config/backend.ts`, returns
 * hard‑coded fake cameras instantly — no HTTP calls, no polling.
 *
 * Polls every 30 s so newly plugged cameras are discovered
 * without a page reload (only when `MOCK_MODE === false`).
 */
export function useCameras(backendUrl: string) {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    // ── Mock mode: serve fake data immediately ────────────────────────────
    if (MOCK_MODE) {
      setCameras(MOCK_CAMERAS);
      setLoading(false);
      setError(null);
      return;
    }

    // ── Real mode: fetch from the Jetson backend ───────────────────────────
    try {
      const res = await fetch(`${backendUrl}/api/cameras`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CameraInfo[] = await res.json();
      setCameras(data);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      // Keep the previous camera list so the UI doesn't break
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchCameras();
    if (MOCK_MODE) return; // No polling needed in mock mode
    const interval = setInterval(fetchCameras, 30_000);
    return () => clearInterval(interval);
  }, [fetchCameras]);

  return { cameras, loading, error, refetch: fetchCameras };
}

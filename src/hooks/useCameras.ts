// ─── useCameras ───────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import type { CameraInfo } from "../types/camera";
import {
  MOCK_MODE,
  MOCK_CAMERAS,
  CAMERA_SOURCE,
  MEDIAMTX_CAMERAS,
} from "../config/backend";

/**
 * Fetches the list of available cameras.
 *
 * - MOCK_MODE → MOCK_CAMERAS (sin red)
 * - CAMERA_SOURCE === "mediamtx" → catálogo estático (MediaMTX / composite)
 * - CAMERA_SOURCE === "api" → GET {backendUrl}/api/cameras + polling 30s
 */
export function useCameras(backendUrl: string) {
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCameras = useCallback(async () => {
    // ── Mock mode ──────────────────────────────────────────────────────────
    if (MOCK_MODE) {
      setCameras(MOCK_CAMERAS);
      setLoading(false);
      setError(null);
      return;
    }

    // ── Catálogo estático MediaMTX / composite 2×2 ─────────────────────────
    if (CAMERA_SOURCE === "mediamtx") {
      setCameras(MEDIAMTX_CAMERAS);
      setLoading(false);
      setError(null);
      return;
    }

    // ── API Flask/FastAPI ──────────────────────────────────────────────────
    try {
      const res = await fetch(`${backendUrl}/api/cameras`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Flask returns:  [{id: 0, nombre: "Camera 0"}, ...]
      type FlaskCamera = { id: number; nombre: string };
      const raw: FlaskCamera[] = await res.json();

      const data: CameraInfo[] = raw.map((item) => ({
        id: `cam_${item.id}`,
        name: (item.nombre || `CAM ${item.id}`).toUpperCase(),
        device: `/dev/video${item.id}`,
        streamPath: `cam${item.id}`,
        quadrant: (item.id % 4) as 0 | 1 | 2 | 3,
      }));

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
    if (MOCK_MODE || CAMERA_SOURCE === "mediamtx") return;
    const interval = setInterval(fetchCameras, 30_000);
    return () => clearInterval(interval);
  }, [fetchCameras]);

  return { cameras, loading, error, refetch: fetchCameras };
}

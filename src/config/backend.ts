// ─── Backend configuration ───────────────────────────────────────────────────

import type { CameraInfo } from "../types/camera";

/**
 * Centralised backend URL — Flask/FastAPI (control, Socket.IO, MJPEG legacy).
 *
 * Se puede configurar con la variable de entorno VITE_BACKEND_URL
 */
export const BACKEND_URL = "http://127.0.0.1:5000";
// export const BACKEND_URL =
//   import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/**
 * URL para Socket.IO.
 * Si está vacía, usa el mismo origen (proxy de Vite en desarrollo).
 * Si se define, conecta directamente a esa URL.
 */
// export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";
export const SOCKET_URL = "http://127.0.0.1:5000";

/**
 * Normaliza VITE_MEDIAMTX_URL.
 *
 * Acepta cualquiera de estas formas:
 *   http://100.99.244.72:8889
 *   http://100.99.244.72:8889/
 *   http://100.99.244.72:8889/camaras
 *   http://100.99.244.72:8889/camaras/
 *
 * → baseUrl = origin del host  |  path = último segmento (o fallback)
 */
function parseMediaMtxEnv(
  raw: string | undefined,
  fallbackPath: string,
): { baseUrl: string; path: string } {
  const input = (raw || "http://localhost:8889").trim();
  try {
    const url = new URL(input);
    const segments = url.pathname.split("/").filter(Boolean);
    // Quitar sufijos de protocolo si el usuario los pegó
    const clean = segments.filter(
      (s) => !["whep", "whip", "wss", "ws"].includes(s.toLowerCase()),
    );
    const path = clean[clean.length - 1] || fallbackPath;
    return {
      baseUrl: url.origin,
      path,
    };
  } catch {
    return { baseUrl: "http://localhost:8889", path: fallbackPath };
  }
}

const _compositeFallback =
  import.meta.env.VITE_COMPOSITE_PATH || "camaras";

const _mediaMtx = parseMediaMtxEnv(
  import.meta.env.VITE_MEDIAMTX_URL,
  _compositeFallback,
);

/**
 * MediaMTX base URL (solo origin, sin path).
 * Ejemplo: http://100.99.244.72:8889
 */
export const MEDIAMTX_URL = _mediaMtx.baseUrl;

/**
 * Path del stream compuesto 2×2 en MediaMTX.
 * URL final WHEP: {MEDIAMTX_URL}/{COMPOSITE_PATH}/whep
 * Ejemplo: http://100.99.244.72:8889/camaras/whep
 */
export const COMPOSITE_PATH =
  import.meta.env.VITE_COMPOSITE_PATH || _mediaMtx.path;

/**
 * Enable mock mode to develop the UI without a running backend.
 *
 * When `true`:
 *  - `useCameras` returns fake camera data immediately (no HTTP calls).
 *  - A canvas‑based mock video stream is shown in every `Camera` widget.
 *  - Socket.IO no se conecta al backend.
 *
 * Set to `false` before connecting to the real Jetson.
 *
 * Se puede configurar con la variable de entorno VITE_MOCK_MODE
 */
export const MOCK_MODE =
  import.meta.env.VITE_MOCK_MODE === "true" ||
  import.meta.env.VITE_MOCK_MODE === undefined;

/**
 * Origen de la lista de cámaras cuando MOCK_MODE === false.
 *
 * - `api`      → GET {BACKEND_URL}/api/cameras  (Flask/FastAPI)
 * - `mediamtx` → catálogo estático MEDIAMTX_CAMERAS (sin HTTP de discovery)
 */
export type CameraSource = "api" | "mediamtx";

export const CAMERA_SOURCE: CameraSource =
  (import.meta.env.VITE_CAMERA_SOURCE as CameraSource) || "mediamtx";

/**
 * Estrategia de video cuando MOCK_MODE === false.
 *
 * - `mjpeg`          → <img> a {BACKEND_URL}/api/stream/{id}
 * - `webrtc`         → WHEP individual por path MediaMTX (cam0, cam1, …)
 * - `composite-crop` → un solo path MediaMTX (p.ej. "camaras") recortado en 2×2
 */
export type VideoStrategy = "mjpeg" | "webrtc" | "composite-crop";

export const VIDEO_STRATEGY: VideoStrategy =
  (import.meta.env.VITE_VIDEO_STRATEGY as VideoStrategy) || "composite-crop";

/**
 * Fake cameras used when `MOCK_MODE === true`.
 */
export const MOCK_CAMERAS: CameraInfo[] = [
  { id: "cam_0", name: "CAM FRONT", device: "/dev/video0" },
  { id: "cam_1", name: "CAM REAR", device: "/dev/video1" },
  { id: "cam_2", name: "CAM WIDE", device: "/dev/video2" },
  { id: "cam_3", name: "CAM 3", device: "/dev/video3" },
];

/**
 * Parsea VITE_CAMERA_LAYOUT (ej: "2x2", "3x3", "1x4").
 * Si no está definida, devuelve null → se usa el catálogo hardcodeado.
 */
function parseLayout(raw: string | undefined): { cols: number; rows: number } | null {
  if (!raw) return null;
  const match = raw.trim().match(/^(\d+)x(\d+)$/i);
  if (!match) return null;
  const cols = parseInt(match[1], 10);
  const rows = parseInt(match[2], 10);
  if (cols < 1 || rows < 1) return null;
  return { cols, rows };
}

/** Genera N cámaras para un layout NxM genérico. */
function generateCameras(cols: number, rows: number): CameraInfo[] {
  const total = cols * rows;  
  return Array.from({ length: total }, (_, i) => ({
    id: `cam_${i}`,
    name: `CAM ${i + 1}`,
    device: `/dev/video${i}`,
    streamPath: `cam${i}`,
    cols,
    rows,
    position: i,
  }));
}

/**
 * Catálogo de cámaras para composite-crop (CAMERA_SOURCE === "mediamtx").
 *
 * Dos modos:
 * 1. **VITE_CAMERA_LAYOUT** → genera automáticamente N cámaras (ej: "3x3" = 9)
 * 2. **Sin variable** → usa el catálogo hardcodeado de abajo (2×2 con nombres)
 *
 * Layout del nvcompositor en la Jetson:
 * ```
 *  cam_0 TL │ cam_1 TR
 *  ─────────┼─────────
 *  cam_2 BL │ cam_3 BR  (monitor)
 * ```
 */
const _layout = parseLayout(import.meta.env.VITE_CAMERA_LAYOUT);

export const MEDIAMTX_CAMERAS: CameraInfo[] = _layout
  ? generateCameras(_layout.cols, _layout.rows)
  : [
      {
        id: "cam_0",
        name: "CAM FRONT",
        device: "/dev/video0",
        streamPath: "cam0",
        cols: 2,
        rows: 2,
        position: 0,
      },
      {
        id: "cam_1",
        name: "CAM REAR",
        device: "/dev/video1",
        streamPath: "cam1",
        cols: 2,
        rows: 2,
        position: 1,
      },
      {
        id: "cam_2",
        name: "CAM WIDE",
        device: "/dev/video2",
        streamPath: "cam2",
        cols: 2,
        rows: 2,
        position: 2,
      },
      {
        id: "cam_3",
        name: "MONITOR",
        device: "ximagesrc",
        streamPath: "monitor",
        cols: 2,
        rows: 2,
        position: 3,
      },
    ];

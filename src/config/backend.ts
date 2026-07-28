// ─── Backend configuration ───────────────────────────────────────────────────

import type { CameraInfo } from "../types/camera";

/**
 * Centralised backend URL — change this single constant to point anywhere
 * (local dev, staging, or the real Jetson).
 * 
 * Se puede configurar con la variable de entorno VITE_BACKEND_URL
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

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
export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true" || 
                         import.meta.env.VITE_MOCK_MODE === undefined;

/**
 * Fake cameras used when `MOCK_MODE === true`.
 *
 * Add / remove entries here to test different grid layouts (1 to 6 cams).
 */
export const MOCK_CAMERAS: CameraInfo[] = [
  { id: "cam_0", name: "CAM FRONT", device: "/dev/video0" },
  { id: "cam_1", name: "CAM REAR", device: "/dev/video1" },
  { id: "cam_2", name: "CAM WIDE", device: "/dev/video2" },
  { id: "cam_3", name: "CAM 3", device: "/dev/video3" },
];

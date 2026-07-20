// ─── Backend configuration ───────────────────────────────────────────────────

import type { CameraInfo } from "../types/camera";

/**
 * Centralised backend URL — change this single constant to point anywhere
 * (local dev, staging, or the real Jetson).
 */
export const BACKEND_URL = "http://localhost:5000";

/**
 * Enable mock mode to develop the UI without a running backend.
 *
 * When `true`:
 *  - `useCameras` returns fake camera data immediately (no HTTP calls).
 *  - A canvas‑based mock video stream is shown in every `Camera` widget.
 *
 * Set to `false` before connecting to the real Jetson.
 */
export const MOCK_MODE = true;

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

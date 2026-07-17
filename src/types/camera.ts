// ─── Camera type ──────────────────────────────────────────────────────────────

export interface CameraInfo {
  /** Unique identifier (e.g. "cam_0") */
  id: string;
  /** Human-readable name (e.g. "CAM FRONT") */
  name: string;
  /** Backend device path (e.g. "/dev/video0") */
  device: string;
}

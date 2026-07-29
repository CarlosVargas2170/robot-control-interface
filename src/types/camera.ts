// ─── Camera type ──────────────────────────────────────────────────────────────

export interface CameraInfo {
  /** Unique identifier (e.g. "cam_0") */
  id: string;
  /** Human-readable name (e.g. "CAM FRONT") */
  name: string;
  /** Backend device path (e.g. "/dev/video0") */
  device: string;
  /**
   * Path en MediaMTX cuando VIDEO_STRATEGY === "webrtc"
   * (p.ej. "cam0" → http://host:8889/cam0/whep)
   */
  streamPath?: string;
  /**
   * Índice de cuadrante 0..3 en el composite 2×2
   * (0=TL, 1=TR, 2=BL, 3=BR) — solo para composite-crop.
   */
  quadrant?: 0 | 1 | 2 | 3;
}

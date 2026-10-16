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
   * @deprecated Usar `cols`, `rows` y `position` para layouts genéricos.
   *
   * Índice de cuadrante 0..3 en el composite 2×2
   * (0=TL, 1=TR, 2=BL, 3=BR) — solo para composite-crop.
   */
  quadrant?: 0 | 1 | 2 | 3;

  /**
   * Layout del grid compuesto.
   *
   * Permite layouts N×M (2×2, 3×3, 1×4, etc.).
   * Cada cámara comparte el mismo `cols` y `rows` del stream compuesto;
   * `position` va de 0 a (cols×rows − 1) en orden de lectura.
   *
   * Ejemplo 2×2: cam_0 → cols:2 rows:2 position:0 (arriba-izquierda)
   * Ejemplo 3×3: cam_4 → cols:3 rows:3 position:4 (centro)
   */
  cols?: number;
  rows?: number;
  position?: number;
}

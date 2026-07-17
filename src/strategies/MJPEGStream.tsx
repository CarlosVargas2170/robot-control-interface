// ─── MJPEG Strategy (Phase 1) ────────────────────────────────────────────────

import { type VideoStreamStrategyProps } from "./types";

/**
 * Streams a camera feed via **MJPEG over HTTP**.
 *
 * The backend serves each video stream as a multipart/x-mixed-replace
 * response. The browser `<img>` tag automatically decodes and displays
 * the JPEG frames in real time — no JavaScript streaming logic needed.
 *
 * **Trade-off:**  Simple  ·  100-300 ms latency  ·  higher bandwidth
 *
 * @example
 * ```tsx
 * <Camera strategy={MJPEGStream} cameraId="cam_0" ... />
 * ```
 */
export default function MJPEGStream({
  cameraId,
  backendUrl,
  className = "block h-full w-full rounded-md object-cover",
  onStatusChange,
}: VideoStreamStrategyProps) {
  const src = `${backendUrl}/video/${cameraId}`;

  return (
    <img
      src={src}
      alt={`Camera ${cameraId}`}
      className={className}
      onLoad={() => onStatusChange?.(true)}
      onError={() => onStatusChange?.(false)}
    />
  );
}

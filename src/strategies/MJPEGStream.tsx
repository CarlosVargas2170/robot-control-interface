// ─── MJPEG Strategy (Phase 1) ────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { type VideoStreamStrategyProps } from "./types";

/**
 * Streams a camera feed via **MJPEG over HTTP**.
 *
 * The backend serves each video stream as a `multipart/x-mixed-replace`
 * response. The browser `<img>` tag automatically decodes and displays
 * the JPEG frames in real time — no JavaScript streaming logic needed.
 *
 * **IMPORTANT**: The `<img>` element is created outside React's DOM
 * management using a ref. This prevents React from interfering with
 * the browser's native MJPEG frame decoding.
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Flask backend uses integer IDs: /api/stream/0, /api/stream/1, ...
  // The frontend cameraId is "cam_0" → extract "0"
  const numericId = cameraId.replace("cam_", "");
  const src = `${backendUrl}/api/stream/${numericId}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log(`[MJPEG] ${cameraId} → ${src}`);

    // Crear el <img> fuera del control de React para que el navegador
    // pueda decodificar el stream MJPEG sin interferencias.
    const img = document.createElement("img");
    img.src = src;
    img.alt = `Camera ${cameraId}`;
    img.className = className;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      console.log(`[MJPEG] ${cameraId} conectado`);
      onStatusChange?.(true);
    };

    img.onerror = () => {
      console.warn(`[MJPEG] ${cameraId} error al cargar`);
      onStatusChange?.(false);
    };

    container.appendChild(img);

    return () => {
      img.remove();
    };
  }, [cameraId, backendUrl, src, className, onStatusChange]);

  return <div ref={containerRef} className="h-full w-full" />;
}

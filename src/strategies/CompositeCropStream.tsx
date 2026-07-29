// ─── Composite Crop Strategy (2×2 MediaMTX mosaic → widgets independientes) ─

import { useEffect, useRef } from "react";
import { type VideoStreamStrategyProps } from "./types";
import {
  MEDIAMTX_URL,
  COMPOSITE_PATH,
  MEDIAMTX_CAMERAS,
} from "../config/backend";
import {
  acquireCompositeStream,
  quadrantRect,
} from "../services/compositeStream";

/**
 * Consume el stream **compuesto 2×2** actual del pipeline GStreamer
 * (`http://jetson:8889/camaras`) y muestra **un solo cuadrante** por widget.
 *
 * Cuadrantes (igual que el nvcompositor):
 * ```
 *  cam_0 (0) TL │ cam_1 (1) TR
 *  ─────────────┼─────────────
 *  cam_2 (2) BL │ cam_3 (3) BR  ← monitor Jetson
 * ```
 *
 * Varios widgets comparten **una sola** conexión WHEP (ahorro de ancho de banda).
 * Ideal mientras el backend no publique paths individuales.
 *
 * **Trade-off:** cero cambios en el .py actual · resolución ½ · no se puede
 * pedir solo una cámara al encoder.
 */
export default function CompositeCropStream({
  cameraId,
  backendUrl: _backendUrl,
  className = "block h-full w-full rounded-md object-cover",
  onStatusChange,
}: VideoStreamStrategyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);

  const meta = MEDIAMTX_CAMERAS.find((c) => c.id === cameraId);
  const quadrant =
    meta?.quadrant ??
    (Number(cameraId.replace("cam_", "")) as 0 | 1 | 2 | 3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const release = acquireCompositeStream(
      MEDIAMTX_URL,
      COMPOSITE_PATH,
      (video, error) => {
        videoRef.current = video;
        if (error) {
          onStatusChange?.(false);
          return;
        }
        if (video) onStatusChange?.(true);
      },
    );

    const draw = () => {
      if (!running) return;
      const video = videoRef.current;
      const parent = canvas.parentElement;

      if (parent) {
        const w = parent.clientWidth || 320;
        const h = parent.clientHeight || 180;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        const { sx, sy, sw, sh } = quadrantRect(quadrant);
        const srcW = video.videoWidth;
        const srcH = video.videoHeight;
        ctx.drawImage(
          video,
          sx * srcW,
          sy * srcH,
          sw * srcW,
          sh * srcH,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      } else {
        // Placeholder mientras conecta
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#8b949e";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          "Conectando stream…",
          canvas.width / 2,
          canvas.height / 2,
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      release();
    };
  }, [cameraId, quadrant, onStatusChange]);

  return <canvas ref={canvasRef} className={className} />;
}

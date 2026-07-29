// ─── WebRTC Strategy (MediaMTX WHEP) ─────────────────────────────────────────

import { useEffect, useRef } from "react";
import { type VideoStreamStrategyProps } from "./types";
import { MEDIAMTX_URL, MEDIAMTX_CAMERAS } from "../config/backend";
import { connectWhep } from "../services/mediamtxWhep";

/**
 * Stream individual vía **WebRTC WHEP** contra MediaMTX.
 *
 * Resuelve el path así:
 *  1. `streamPath` del catálogo MEDIAMTX_CAMERAS (id → streamPath)
 *  2. fallback: cameraId sin prefijo "cam_"  (cam_0 → "0" no es ideal;
 *     mejor definir streamPath en config)
 *
 * URL: `{MEDIAMTX_URL}/{streamPath}/whep`
 *
 * **Trade-off:** baja latencia · un stream por cámara · requiere paths
 * individuales publicados en MediaMTX (ver jetson/camera_pipeline.py).
 */
export default function WebRTCStream({
  cameraId,
  backendUrl: _backendUrl,
  className = "block h-full w-full rounded-md object-cover",
  onStatusChange,
}: VideoStreamStrategyProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const meta = MEDIAMTX_CAMERAS.find((c) => c.id === cameraId);
  const streamPath =
    meta?.streamPath ?? cameraId.replace(/^cam_/, "cam");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const abort = new AbortController();
    let pc: RTCPeerConnection | null = null;

    (async () => {
      try {
        console.log(`[WebRTC] ${cameraId} → ${MEDIAMTX_URL}/${streamPath}/whep`);
        const conn = await connectWhep(MEDIAMTX_URL, streamPath, abort.signal);
        pc = conn.pc;
        video.srcObject = conn.stream;
        await video.play().catch(() => undefined);
        onStatusChange?.(true);
        console.log(`[WebRTC] ${cameraId} conectado`);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.warn(`[WebRTC] ${cameraId}`, err);
        onStatusChange?.(false);
      }
    })();

    return () => {
      abort.abort();
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      pc?.close();
    };
  }, [cameraId, streamPath, onStatusChange]);

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      playsInline
      autoPlay
    />
  );
}

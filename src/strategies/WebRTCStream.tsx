// ─── WebRTC Strategy (Phase 2 — stub) ────────────────────────────────────────

import { type VideoStreamStrategyProps } from "./types";

/**
 * **Phase 2 — WebRTC video stream** (placeholder).
 *
 * When implemented, this will use the native `RTCPeerConnection` API +
 * a signalling handshake (`POST /offer`) to establish a low-latency,
 * bandwidth-efficient peer-to-peer video connection with the Jetson
 * backend.
 *
 * **Trade-off:**  50-150 ms latency  ·  efficient bandwidth  ·  complex setup
 *
 * @example
 * ```tsx
 * // Swap one line to migrate:
 * <Camera strategy={WebRTCStream} cameraId="cam_0" ... />
 * ```
 */
export default function WebRTCStream({
  cameraId: _cameraId,
  backendUrl: _backendUrl,
  className: _className,
  onStatusChange,
}: VideoStreamStrategyProps) {
  // TODO Phase 2: implement RTCPeerConnection + signalling
  onStatusChange?.(false);
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#161b22] text-sm text-[#555]">
      WebRTC — pendiente de implementar
    </div>
  );
}

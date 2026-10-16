// ─── Mock Stream Strategy ────────────────────────────────────────────────────

import { useRef, useEffect } from "react";
import { type VideoStreamStrategyProps } from "./types";

/**
 * **Canvas-based mock video stream** for UI development.
 *
 * Renders an animated scene that simulates a live camera feed:
 *  - dark surveillance-style background with subtle noise
 *  - a moving "object" (coloured rectangle) crossing the frame
 *  - timestamp + camera label overlay
 *  - scanline effect
 *
 * No backend or network required.
 *
 * @example
 * ```tsx
 * <Camera strategy={MockStream} cameraId="cam_0" name="CAM FRONT" />
 * ```
 */
export default function MockStream({
  cameraId,
  backendUrl: _backendUrl,
  className = "block h-full w-full rounded-md object-cover",
  onStatusChange,
}: VideoStreamStrategyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let startTime = performance.now();
    let frameCount = 0;

    // Resize observer — keep the canvas crisp
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Notify the parent that the "stream" is connected
    onStatusChange?.(true);

    // ── Drawing helpers ─────────────────────────────────────────────────────

    const W = () => canvas.getBoundingClientRect().width;
    const H = () => canvas.getBoundingClientRect().height;

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(48,54,61,0.25)";
      ctx.lineWidth = 0.5;
      const step = 40;
      for (let x = 0; x <= W(); x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H());
        ctx.stroke();
      }
      for (let y = 0; y <= H(); y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W(), y);
        ctx.stroke();
      }
    };

    const drawTarget = (x: number, y: number) => {
      // Crosshair
      ctx.strokeStyle = "rgba(88,166,255,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 15, y);
      ctx.lineTo(x + 15, y);
      ctx.moveTo(x, y - 15);
      ctx.lineTo(x, y + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawMovingRect = (t: number) => {
      const w = W();
      const h = H();
      // Smooth back-and-forth motion
      const period = 6000; // ms for one full cycle
      const phase = (t % period) / period;
      const x = w * 0.2 + (w * 0.6) * (0.5 + 0.5 * Math.sin(phase * Math.PI * 2));
      const y = h * 0.3 + (h * 0.4) * (0.5 + 0.5 * Math.cos(phase * Math.PI * 3.7));

      ctx.fillStyle = "rgba(88,166,255,0.18)";
      ctx.strokeStyle = "rgba(88,166,255,0.5)";
      ctx.lineWidth = 1.5;
      const s = 28;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      ctx.strokeRect(x - s / 2, y - s / 2, s, s);
      drawTarget(x, y);
    };

    const drawHUD = () => {
      const now = new Date();
      const ts =
        now.toISOString().slice(11, 19) + "." + String(now.getMilliseconds()).padStart(3, "0");

      ctx.font = "10px 'Courier New', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText(`REC ● ${ts}`, 12, 18);
      ctx.fillText(cameraId.toUpperCase(), 12, 32);
      ctx.fillText(`${frameCount % 60} fps`, W() - 50, 18);
    };

    const drawScanlines = () => {
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      for (let y = 0; y < H(); y += 3) {
        ctx.fillRect(0, y, W(), 1);
      }
    };

    // ── Animation loop ──────────────────────────────────────────────────────

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;

      // Background
      ctx.fillStyle = "#0a0e14";
      ctx.fillRect(0, 0, W(), H());

      // Subtle noise-like dots
      ctx.fillStyle = "rgba(22,27,34,0.5)";
      for (let i = 0; i < 40; i++) {
        const nx = (Math.sin(elapsed * 0.001 + i * 17.3) * 0.5 + 0.5) * W();
        const ny = (Math.cos(elapsed * 0.0013 + i * 11.7) * 0.5 + 0.5) * H();
        ctx.fillRect(nx, ny, 2, 2);
      }

      drawGrid();
      drawMovingRect(elapsed);
      drawScanlines();
      drawHUD();

      frameCount++;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [cameraId, onStatusChange]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        imageRendering: "auto",
      }}
    />
  );
}

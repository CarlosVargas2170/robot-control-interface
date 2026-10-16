// ─── Camera widget (strategy-driven) ─────────────────────────────────────────

import { type ComponentType } from "react";
import { MJPEGStream, type VideoStreamStrategyProps } from "../strategies";
import { BACKEND_URL } from "../config/backend";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CameraProps {
  /** Backend camera identifier (e.g. "cam_0") */
  cameraId: string;
  /** Human-readable label shown in the header */
  name: string;
  /**
   * Video-streaming strategy.
   *
   * Swap to `WebRTCStream` when migrating to Phase 2.
   * @default MJPEGStream
   */
  strategy?: ComponentType<VideoStreamStrategyProps>;
  /** Base URL of the backend server */
  backendUrl?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Camera({
  cameraId,
  name,
  strategy: Strategy = MJPEGStream,
  backendUrl = BACKEND_URL,
}: CameraProps) {
  return (
    <div
      data-cam-id={cameraId}
      className={[
        // Layout & sizing
        "relative flex w-full h-full min-w-40 min-h-32.5 shrink-0 flex-col overflow-hidden",
        // Appearance
        "rounded-xl border-2 border-[#30363d] bg-[#0d1117]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
        // Interaction
        "cursor-grab select-none",
        "transition-[border-color,box-shadow] duration-200",
        // States
        "active:cursor-grabbing",
        "hover:border-[#58a6ff]",
        "group",
      ].join(" ")}
    >
      {/* ──────────── HEADER ──────────── */}
      <div
        className={[
          "-mx-1 -mt-0.5 mb-1.5 flex shrink-0 items-center justify-between",
          "rounded-md border-b border-[#1c2333]",
          "bg-[#0d1117]/50 px-2 py-0.5 backdrop-blur-sm",
          "text-xs font-medium text-[#8b949e]",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center gap-1.5",
            "text-xs font-semibold text-[#f0f6fc]",
            "transition-colors duration-200",
            "hover:text-[#58a6ff]",
          ].join(" ")}
        >
          <i className="fas fa-video text-[13px] text-[#58a6ff] p-2" />
          {name}
        </span>

        <span className="flex items-center gap-2 text-[10px] text-[#8b949e]">
          <span className="text-[#238636]">&bull; ONLINE</span>
        </span>
      </div>

      {/* ──────────── BODY (strategy-injected) ──────────── */}
      <div
        className={[
          "relative mb-1 flex flex-1 items-center justify-center overflow-hidden",
          "min-h-10 rounded-md bg-[#0d1117]",
        ].join(" ")}
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #161b22 0px, #161b22 6px, #0d1117 6px, #0d1117 12px)",
        }}
      >
        {/* The injected strategy renders the actual video stream */}
        <Strategy cameraId={cameraId} backendUrl={backendUrl} />

        {/* LIVE badge */}
        <span
          className={[
            "absolute top-1.5 left-2 z-5 flex items-center gap-1.25",
            "rounded-full border border-[#30363d]",
            "bg-black/70 px-2.5 py-0.5 backdrop-blur-sm",
            "text-[9px] text-[#58a6ff]",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-1.25 w-1.25 rounded-full",
              "animate-pulse bg-[#238636]",
            ].join(" ")}
          />
          LIVE
        </span>

        {/* Pop-out button — visible on group hover */}
        <span
          className={[
            "absolute top-1.5 right-2 z-5 flex items-center justify-center",
            "h-6.5 w-6.5 rounded-md",
            "border border-[#30363d] bg-black/65 backdrop-blur-sm",
            "cursor-pointer text-xs text-[#8b949e]",
            "opacity-0 transition-[opacity,color,background-color] duration-200",
            "group-hover:opacity-100",
            "hover:border-[#58a6ff] hover:bg-black/85 hover:text-[#58a6ff]",
          ].join(" ")}
        >
          <i className="fas fa-expand" />
        </span>
      </div>     
    </div>
  );
}

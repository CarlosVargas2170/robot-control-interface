// ─── GraphWidget — contenedor de gráfico de telemetría ────────────────────────

import { useRef, useState, useEffect, type ComponentType } from "react";
import type { GraphWidgetProps } from "../strategies/graphs/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GraphWidgetComponentProps {
  /** Tipo de gráfico (ej: "accel", "wasdKeys", etc.) */
  graphType: string;
  /** Estrategia de renderizado (componente canvas o CSS) */
  graphStrategy: ComponentType<GraphWidgetProps>;
  /** Etiqueta visible en el header */
  label: string;
  /** Ícono Font Awesome (ej: "fas fa-keyboard") */
  icon?: string;
  /** Si debe usar datos simulados */
  isMock?: boolean;
  /** Handler para iniciar resize (desde hook useOverlayDrag) */
  onResizePointerDown?: (e: React.PointerEvent) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GraphWidget({
  graphType: _graphType,
  graphStrategy: Strategy,
  label,
  icon = "fas fa-chart-simple",
  isMock = false,
  onResizePointerDown,
}: GraphWidgetComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 200, height: 200 });

  // ── Observar tamaño del contenedor ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      // Descontar padding del wrapper (16px horizontal, ~40px header)
      const w = el.clientWidth - 16;
      const h = el.clientHeight - 40;
      if (w > 0 && h > 0) setCanvasSize({ width: w, height: h });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={[
        "relative flex h-full w-full min-h-[100px] min-w-[80px] shrink-0 flex-col overflow-hidden",
        "rounded-xl border border-[#30363d]/30",
        "bg-[rgba(10,14,20,0.35)] backdrop-blur-md",
        "shadow-[0_4px_16px_rgba(0,0,0,0.3)]",
        "select-none",
        "group",
      ].join(" ")}
    >
      {/* ── Header ── */}
      {label && (
        <div
          className={[
            "flex shrink-0 items-center gap-1.5",
            "border-b border-[#30363d]/25",
            "px-2.5 py-1.5",
            "text-[11px] font-medium text-[#8b949e]",
          ].join(" ")}
        >
          <i className={`${icon} text-[#58a6ff] text-xs`} />
          <span>{label}</span>
        </div>
      )}

      {/* ── Body (Strategy inyectado) ── */}
      <div className="flex flex-1 items-center justify-center p-2">
        <Strategy
          width={canvasSize.width}
          height={canvasSize.height}
          isMock={isMock}
        />
      </div>

      {/* ── Resize handle SE (igual que cámaras) ── */}
      <div
        data-resize-handle="se"
        onPointerDown={onResizePointerDown}
        className={[
          "absolute bottom-0 right-0 z-10 h-[18px] w-[18px]",
          "cursor-nwse-resize rounded-bl-[10px]",
          "border-r-2 border-b-2 border-[#58a6ff]",
          "bg-[#58a6ff]/10 transition-colors duration-200",
          "hover:bg-[#58a6ff]/25",
        ].join(" ")}
      />
    </div>
  );
}

// ─── OverlayGraph — gráfico flotante con drag & resize ───────────────────────

import { type ComponentType } from "react";
import { useOverlayDrag, type DragState } from "../hooks/useOverlayDrag";
import GraphWidget from "./GraphWidget";
import type { GraphWidgetProps } from "../strategies/graphs/types";

export interface OverlayGraphProps {
  /** Posición y tamaño inicial */
  initial: DragState;
  /** Si false, drag y resize están deshabilitados (modo edición) */
  editMode: boolean;
  /** Si true, mantener relación 1:1 al redimensionar (gráficos circulares) */
  keepSquare?: boolean;
  /** Callback cuando cambia posición o tamaño */
  onChange?: (state: DragState) => void;
  /** Props pasadas directamente a GraphWidget */
  graphType: string;
  graphStrategy: ComponentType<GraphWidgetProps>;
  label: string;
  icon?: string;
  isMock?: boolean;
}

/**
 * Wrapper que combina `GraphWidget` con `useOverlayDrag`.
 *
 * - En modo edición (editMode=true): permite arrastrar y redimensionar.
 * - En modo bloqueado (editMode=false): posición y tamaño fijos.
 */
export default function OverlayGraph({
  initial,
  editMode,
  keepSquare = false,
  onChange,
  graphType,
  graphStrategy,
  label,
  icon,
  isMock,
}: OverlayGraphProps) {
  const { state, dragHandlers, resizeHandlers } = useOverlayDrag({
    initial,
    enabled: editMode,
    keepSquare,
    onChange,
  });

  const isCentered =
    graphType === "accel" || graphType === "radarFront" || graphType === "gps";

  return (
    <div
      className={[
        "absolute z-[500] select-none",
        editMode && "cursor-grab",
      ].join(" ")}
      style={{
        top: `${state.top}px`,
        left: isCentered ? "50%" : `${state.left}px`,
        transform: isCentered ? "translateX(-50%)" : "none",
        width: `${state.width}px`,
        height: `${state.height}px`,
      }}
      {...dragHandlers}
    >
      <GraphWidget
        graphType={graphType}
        graphStrategy={graphStrategy}
        label={label}
        icon={icon}
        isMock={isMock}
        onResizePointerDown={resizeHandlers.onPointerDown}
      />
    </div>
  );
}

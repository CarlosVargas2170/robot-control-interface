// ─── useOverlayDrag — hook de drag & resize para overlays ────────────────────

import { useState, useCallback, useRef, useEffect } from "react";

export interface DragState {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface UseOverlayDragOptions {
  /** Posición y tamaño inicial */
  initial: DragState;
  /** Si false, drag y resize están deshabilitados */
  enabled?: boolean;
  /** Ancho mínimo en px */
  minWidth?: number;
  /** Alto mínimo en px */
  minHeight?: number;
  /** Si true, mantener relación 1:1 al redimensionar (gráficos circulares) */
  keepSquare?: boolean;
  /** Called when position or size changes */
  onChange?: (state: DragState) => void;
}

/**
 * Hook que provee drag & resize a cualquier div overlay.
 *
 * - `dragHandlers.onPointerDown`: se asigna al div contenedor para iniciar drag.
 * - `resizeHandlers.onPointerDown`: se asigna al handle SE para iniciar resize.
 * - `style`: estilos absolutos (top, left, width, height) ya calculados.
 */
export function useOverlayDrag({
  initial,
  enabled = true,
  minWidth = 80,
  minHeight = 80,
  keepSquare = false,
  onChange,
}: UseOverlayDragOptions) {
  const [state, setState] = useState<DragState>(initial);
  const draggingRef = useRef(false);
  const resizingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, top: 0, left: 0, w: 0, h: 0 });

  // Sync initial prop when it changes externally (e.g. layout apply)
  useEffect(() => {
    setState(initial);
  }, [initial.top, initial.left, initial.width, initial.height]);

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      // Ignorar si viene de un handle de resize
      const target = e.target as HTMLElement;
      if (target.closest("[data-resize-handle]")) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      draggingRef.current = true;
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        top: state.top,
        left: state.left,
        w: state.width,
        h: state.height,
      };
    },
    [enabled, state.top, state.left, state.width, state.height],
  );

  // ── Resize ────────────────────────────────────────────────────────────────
  const onResizeDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizingRef.current = true;
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        top: state.top,
        left: state.left,
        w: state.width,
        h: state.height,
      };
    },
    [enabled, state.top, state.left, state.width, state.height],
  );

  // ── Move (shared) ─────────────────────────────────────────────────────────
  const onMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current && !resizingRef.current) return;

      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;

      const next: DragState = { ...state };

      if (draggingRef.current) {
        next.top = Math.max(0, startRef.current.top + dy);
        next.left = startRef.current.left + dx;
      }

      if (resizingRef.current) {
        next.width = Math.max(minWidth, startRef.current.w + dx);
        next.height = Math.max(minHeight, startRef.current.h + dy);
        if (keepSquare) {
          const s = Math.max(next.width, next.height);
          next.width = s;
          next.height = s;
        }
      }

      setState(next);
      onChange?.(next);
    },
    [state, minWidth, minHeight, keepSquare, onChange],
  );

  // ── Up (shared) ───────────────────────────────────────────────────────────
  const onUp = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current && !resizingRef.current) return;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      draggingRef.current = false;
      resizingRef.current = false;
    },
    [],
  );

  return {
    /** Posición y tamaño actuales */
    state,
    setState,
    /** Handlers de drag — aplicar al div contenedor */
    dragHandlers: {
      onPointerDown: onDragDown,
      onPointerMove: onMove,
      onPointerUp: onUp,
    },
    /** Handler de resize — aplicar al handle SE */
    resizeHandlers: {
      onPointerDown: onResizeDown,
    },
    /** Si está siendo arrastrado ahora mismo */
    isDragging: draggingRef,
  };
}

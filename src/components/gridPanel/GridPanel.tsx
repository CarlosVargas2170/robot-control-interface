import { useEffect, useRef } from "react";
import { GridStack } from "gridstack";
import type { GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import "./GridPanel.css";

export interface GridPanelProps {
  /** GridStack initialization options. Merged with sensible defaults. */
  options?: GridStackOptions;
  /** Grid item elements. Each child should be a `<div className="grid-stack-item">` with `grid-stack-item-content`. */
  children?: React.ReactNode;
  /** Fired once the grid instance is ready. Use to add/remove widgets imperatively. */
  onGridReady?: (grid: GridStack) => void;
  /** Extra CSS classes appended to the container. */
  className?: string;
  /** When true, disables drag & resize for all widgets in the grid */
  locked?: boolean;
}

const DEFAULT_OPTIONS: GridStackOptions = {
  float: true,
  margin: 8,
  cellHeight: "auto",
  column: 12,
};

/**
 * Full-screen grid panel powered by GridStack.
 *
 * Renders a `grid-stack` container that spans the entire viewport.
 * Handles initialisation and destruction of the GridStack instance
 * automatically so parent components only need to declare the layout.
 */
export default function GridPanel({
  options,
  children,
  onGridReady,
  className = "",
  locked = false,
}: GridPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridStack | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const mergedOptions: GridStackOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    const grid = GridStack.init(mergedOptions, el);
    gridRef.current = grid;
    onGridReady?.(grid);

    return () => {
      grid.destroy(false);
      gridRef.current = null;
    };
    // Only init on mount — options and onGridReady are intentionally
    // treated as initial values to avoid re-initialising the grid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Edit mode: enable/disable drag & resize ──
  useEffect(() => {
    gridRef.current?.setStatic(locked);
  }, [locked]);

  return (
    <div
      ref={containerRef}
      className={`grid-stack${className ? ` ${className}` : ""}`}
    >
      {children}
    </div>
  );
}

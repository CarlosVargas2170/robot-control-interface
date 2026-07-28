// ─── WASD Keys — Teclado virtual ─────────────────────────────────────────────

import type { GraphWidgetProps } from "./types";
import { useState, useEffect, useCallback, useMemo } from "react";

/** Gap entre teclas en px */
const GAP = 4;

/**
 * Teclas WASD visuales que se iluminan al presionar la tecla física.
 *
 * - Layout en cruz: W arriba, A-S-D abajo (grid 3×2).
 * - El tamaño de cada tecla se calcula para llenar el contenedor
 *   tanto en ancho como en alto, sin `transform: scale()`.
 * - La fuente también escala proporcionalmente.
 */
export default function WASDKeys({ width, height }: GraphWidgetProps) {
  const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });

  // ── Calcular tamaño de tecla que llena el contenedor ──
  const { keyPx, fontSize } = useMemo(() => {
    // 3 columnas → 2 gaps  |  2 filas → 1 gap
    const kw = Math.floor((width - GAP * 2) / 3);
    const kh = Math.floor((height - GAP * 1) / 2);
    const size = Math.max(18, Math.min(kw, kh));
    return { keyPx: size, fontSize: Math.max(9, Math.round(size * 0.35)) };
  }, [width, height]);

  // ── Listeners de teclado ──
  const handleKey = useCallback(
    (pressed: boolean) => (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
        setKeys((prev) => ({ ...prev, [k]: pressed }));
      }
    },
    [],
  );

  useEffect(() => {
    const down = handleKey(true);
    const up = handleKey(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [handleKey]);

  // ── Layout en cruz:   W
  //                     A S D ──
  const keyDefs = [
    { key: "w", row: 0, col: 1 },
    { key: "a", row: 1, col: 0 },
    { key: "s", row: 1, col: 1 },
    { key: "d", row: 1, col: 2 },
  ];

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(3, ${keyPx}px)`,
          gridTemplateRows: `repeat(2, ${keyPx}px)`,
          gap: `${GAP}px`,
        }}
      >
        {keyDefs.map(({ key, row, col }) => {
          const isActive = keys[key as keyof typeof keys];
          return (
            <div
              key={key}
              data-key={key}
              className={[
                "flex items-center justify-center rounded-lg select-none",
                "font-bold uppercase font-mono",
                "border-2 transition-all duration-75",
                // Inactiva
                "bg-[#161b22] border-[#30363d] text-[#8b949e]",
                // Activa
                isActive &&
                  "bg-[#58a6ff]/20 border-[#58a6ff] text-[#58a6ff]",
                isActive && "shadow-[0_0_14px_rgba(88,166,255,0.45)]",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
                width: `${keyPx}px`,
                height: `${keyPx}px`,
                fontSize: `${fontSize}px`,
              }}
            >
              {key}
            </div>
          );
        })}
      </div>
    </div>
  );
}

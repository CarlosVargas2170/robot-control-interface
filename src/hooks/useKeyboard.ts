// ─── useKeyboard — hook de eventos de teclado ─────────────────────────────────

import { useState, useEffect, useCallback } from "react";

export interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

const EMPTY: KeyState = { w: false, a: false, s: false, d: false };

/**
 * Escucha eventos `keydown`/`keyup` para las teclas WASD.
 *
 * Retorna el estado actual de cada tecla. Útil para alimentar
 * el gráfico de teclas virtuales y/o enviar comandos de control.
 *
 * @param enabled Si `false`, no se registran eventos (útil cuando el
 *                control está deshabilitado desde el panel de ajustes).
 */
export function useKeyboard(enabled = true) {
  const [keys, setKeys] = useState<KeyState>(EMPTY);

  const handleKey = useCallback(
    (pressed: boolean) =>
      (e: KeyboardEvent) => {
        if (!enabled) return;
        const k = e.key.toLowerCase();
        if (k in EMPTY) {
          e.preventDefault();
          setKeys((prev) => ({ ...prev, [k]: pressed }));
        }
      },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setKeys(EMPTY);
      return;
    }
    const down = handleKey(true);
    const up = handleKey(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [enabled, handleKey]);

  return keys;
}

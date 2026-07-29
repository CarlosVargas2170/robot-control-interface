// ─── NavbarModeSelect ────────────────────────────────────────────────────────────
// Select dropdown para cambiar el modo del robot (TELEDIRIGIDO, AUTONOMO, etc.)

import { useCallback } from "react";

/** Modos disponibles con su comando serial equivalente */
const MODES = [
  { value: "TELEDIRIGIDO", label: "Teledirigido" },
  { value: "AUTONOMO", label: "Autónomo" },
  { value: "MANDO RC", label: "Mando RC" },
] as const;

interface NavbarModeSelectProps {
  /** Modo actual reportado por el backend */
  currentMode: string;
  /** Si el usuario tiene el control (habilita el select) */
  hasControl: boolean;
  /** Callback al seleccionar un modo */
  onSetMode: (mode: string) => void;
}

export function NavbarModeSelect({ currentMode, hasControl, onSetMode }: NavbarModeSelectProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newMode = e.target.value;
      if (newMode !== currentMode) {
        onSetMode(newMode);
      }
    },
    [currentMode, onSetMode],
  );

  // Si el modo actual no está en la lista (ej: DESCONOCIDO), mostrarlo como disabled extra
  const knownMode = MODES.some((m) => m.value === currentMode);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[#8b949e] font-medium uppercase tracking-wider hidden sm:inline">
        Modo
      </span>
      <select
        value={knownMode ? currentMode : ""}
        onChange={handleChange}
        disabled={!hasControl}
        className={[
          "text-xs font-semibold rounded px-2 py-1.5 border outline-none appearance-none cursor-pointer",
          "transition-colors duration-150 min-w-[120px]",
          hasControl
            ? "bg-[#1c2333] border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] focus:border-[#58a6ff]"
            : "bg-[#0d1117] border-[#30363d] text-[#484f58] cursor-not-allowed opacity-60",
        ].join(" ")}
        style={{
          backgroundImage: hasControl
            ? `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2358a6ff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`
            : `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23484f58' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 6px center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "16px 16px",
          paddingRight: "28px",
        }}
      >
        {!knownMode && (
          <option value="" disabled>
            {currentMode || "DESCONOCIDO"}
          </option>
        )}
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

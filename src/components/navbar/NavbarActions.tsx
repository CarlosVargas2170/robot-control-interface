// ─── NavbarActions ─────────────────────────────────────────────────────────────
// Botones de acción: Tomar control, Liberar, STOP

interface NavbarActionsProps {
  hasControl: boolean;
  onClaimControl?: () => void;
  onReleaseControl?: () => void;
  onEmergencyStop?: () => void;
}

export function NavbarActions({ hasControl, onClaimControl, onReleaseControl, onEmergencyStop }: NavbarActionsProps) {
  return (
    <>
      {onClaimControl && (
        <button
          onClick={onClaimControl}
          disabled={hasControl}
          className={[
            "hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold",
            "transition-all duration-150",
            hasControl
              ? "border border-[#30363d] bg-transparent text-[#484f58] cursor-not-allowed opacity-40"
              : "border border-[#58afe9] bg-[#1474ad] text-white cursor-pointer hover:bg-[#1a8acd] active:scale-95",
          ].join(" ")}
        >
          <i className="fas fa-play text-[10px]" />
          Tomar control
        </button>
      )}
      {onReleaseControl && (
        <button
          onClick={onReleaseControl}
          disabled={!hasControl}
          className={[
            "hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold",
            "transition-all duration-150",
            hasControl
              ? "border border-[#48535a] bg-[#252b2f] text-[#d9dfe2] cursor-pointer hover:bg-[#2c3438] active:scale-95"
              : "border border-[#30363d] bg-transparent text-[#484f58] cursor-not-allowed opacity-40",
          ].join(" ")}
        >
          <i className="fas fa-hand text-[10px]" />
          Liberar
        </button>
      )}
      {onEmergencyStop && (
        <button
          onClick={onEmergencyStop}
          className={[
            "inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold",
            "transition-all duration-150",
            "border border-[#f07b7b] bg-[#9e2727] text-white cursor-pointer",
            "hover:bg-[#b82e2e] active:scale-95 active:bg-[#741c1c]",
            "sm:px-3 sm:py-1.5 px-2 py-1",
          ].join(" ")}
        >
          <i className="fas fa-exclamation-triangle text-[10px]" />
          <span className="hidden sm:inline">STOP</span>
        </button>
      )}
    </>
  );
}

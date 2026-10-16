// ─── SidePanel ───────────────────────────────────────────────────────────────
// Panel lateral fijo que muestra diferentes controles según el tipo de control seleccionado

import { DrivingPanel } from "./DrivingPanel";
import { SteeringWheelPanel } from "./SteeringWheelPanel";
import type { RobotStatus } from "../types/robot";

interface SidePanelProps {
  controlType: "teclado" | "volante" | "mando";
  status: RobotStatus;
  isConnected: boolean;
  hasControl: boolean;
  canDrive: boolean;
  speed: number;
  controlError: string | null;
  serialLog: string[];
  onSpeedChange: (speed: number) => void;
  onClaimControl: () => void;
  onReleaseControl: () => void;
  onEmergencyStop: () => void;
  onCycleMode: () => void;
  onClearLog: () => void;
  onSendSerialCommand: (command: string) => void;
  onPopOut?: () => void;
  onClose: () => void;
  /** Cuando true, ocupa 100% del viewport en vez de fixed sidebar (popup). */
  isPopout?: boolean;
}

export function SidePanel({
  controlType,
  status,
  isConnected,
  hasControl,
  canDrive,
  speed,
  controlError,
  serialLog,
  onSpeedChange,
  onClaimControl,
  onReleaseControl,
  onEmergencyStop,
  onCycleMode,
  onClearLog,
  onSendSerialCommand,
  onPopOut,
  onClose,
  isPopout = false,
}: SidePanelProps) {
  // ── Clases condicionales: popup vs sidebar fijo ──────────────────────────
  const containerClass = isPopout
    ? "w-full h-full overflow-y-auto bg-[#0d1117]"
    : "fixed right-0 top-0 bottom-0 w-120 bg-linear-to-b from-[#0f1624]/97 to-[#0a0e14]/97 border-l border-[#58a6ff]/25 shadow-[-8px_0_24px_rgba(0,0,0,0.4)] z-998 overflow-hidden shrink-0";

  // En popup el contenido se centra con ancho máximo legible.
  // En sidebar fijo, ocupa todo el ancho (480px).
  const contentClass = isPopout
    ? "w-full max-w-3xl mx-auto min-h-full overflow-y-auto p-4.5 pt-14 pb-6 flex flex-col gap-4"
    : "w-full h-full overflow-y-auto p-4.5 pt-14 pb-6 flex flex-col gap-4";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        
        {/* Header */}
        <div className="border-b border-[#30363d]/50 pb-3">
          {/* <span className="dp-eyebrow">SISTEMA DE CONDUCCIÓN</span> */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex gap-1 ml-auto">
              {onPopOut && !isPopout && (
                <button
                  onClick={onPopOut}
                  className="bg-transparent border border-[#30363d]/50 text-[#8b949e] w-7 h-7 rounded-md cursor-pointer transition-all text-xs flex items-center justify-center p-0 hover:bg-[#1c2333] hover:border-[#58a6ff]/50 hover:text-[#58a6ff]"
                  title="Abrir en ventana externa"
                >
                  <i className="fas fa-external-link-alt" />
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-transparent border border-[#30363d]/50 text-[#c9d1d9] w-7 h-7 rounded-md cursor-pointer transition-all text-xs flex items-center justify-center p-0 hover:bg-[#da3633]/20 hover:border-[#ff5050]/60 hover:text-[#ff5050]"
                title={isPopout ? "Cerrar ventana" : "Cerrar"}
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido según el tipo de control */}
        {controlType === "teclado" && (
          <DrivingPanel
            status={status}
            isConnected={isConnected}
            hasControl={hasControl}
            canDrive={canDrive}
            speed={speed}
            controlError={controlError}
            serialLog={serialLog}
            onSpeedChange={onSpeedChange}
            onClaimControl={onClaimControl}
            onReleaseControl={onReleaseControl}
            onEmergencyStop={onEmergencyStop}
            onCycleMode={onCycleMode}
            onClearLog={onClearLog}
            onSendSerialCommand={onSendSerialCommand}
          />
        )}

        {controlType === "volante" && (
          <SteeringWheelPanel
            isConnected={isConnected}
            hasControl={hasControl}
            canDrive={canDrive}
            speed={speed}
            controlError={controlError}
            onSpeedChange={onSpeedChange}
            onClaimControl={onClaimControl}
            onReleaseControl={onReleaseControl}
            onEmergencyStop={onEmergencyStop}
          />
        )}

        {controlType === "mando" && (
          <div className="text-center py-8 text-[#8b949e]">
            <i className="fas fa-gamepad text-4xl mb-3 text-[#484f58]" />
            <p className="text-sm">Panel de mando</p>
            <p className="text-xs mt-2">Próximamente</p>
          </div>
        )}
      </div>
    </div>
  );
}

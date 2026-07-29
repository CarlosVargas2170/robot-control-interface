// ─── DrivingPanel ────────────────────────────────────────────────────────────
// Panel de conducción para modo teclado (WASD)

import type { RobotStatus } from "../types/robot";

interface DrivingPanelProps {
  status: RobotStatus;
  isConnected: boolean;
  hasControl: boolean;
  canDrive: boolean;
  speed: number;
  controlError: string | null;
  onSpeedChange: (speed: number) => void;
  onClaimControl: () => void;
  onReleaseControl: () => void;
  onEmergencyStop: () => void;
  onCycleMode: () => void;
}

export function DrivingPanel({
  status,
  isConnected,
  hasControl,
  canDrive,
  speed,
  controlError,
  onSpeedChange,
  onClaimControl,
  onReleaseControl,
  onEmergencyStop,
  onCycleMode,
}: DrivingPanelProps) {
  return (
    <div className="space-y-4">
      {/* ═══ INDICADORES DE ESTADO ═══ */}
      <div className="grid grid-cols-2 gap-2">
        <StatusItem label="Backend" value={isConnected ? "Conectado" : "Desconectado"} connected={isConnected} />
        <StatusItem label="STM32" value={status.serial_connected ? "Conectada" : "Desconectada"} connected={status.serial_connected} />
        <StatusItem label="Modo" value={status.robot_mode} connected={status.robot_mode !== "DESCONOCIDO"} />
        <StatusItem label="Failsafe" value={status.failsafe ? "ACTIVO" : "INACTIVO"} connected={!status.failsafe} warn={status.failsafe} />
      </div>

      {/* ═══ CONTROL EN VIVO ═══ */}
      <Section>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="dp-eyebrow">CONTROL EN VIVO</span>
            {/* <h2 className="text-[17px] font-semibold text-white mt-1">Teclado WASD</h2> */}
          </div>
          <button
            onClick={onCycleMode}
            disabled={!hasControl}
            className="px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg border border-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cambiar modo
          </button>
        </div>

        {/* Teclas visuales */}
        {/* <div className="flex flex-col items-center gap-1.5 my-4">
          <KeyButton label="W" active={false} disabled={!canDrive} />
          <div className="flex gap-1.5">
            <KeyButton label="A" active={false} disabled={!canDrive} />
            <KeyButton label="S" active={false} disabled={!canDrive} />
            <KeyButton label="D" active={false} disabled={!canDrive} />
          </div>
        </div> */}

        {/* <p className="text-[#8b949e]/70 text-[11px] text-center leading-relaxed">
          Mantén presionadas las teclas para mover · F para neutro
        </p> */}
      </Section>

      {/* ═══ SEGURIDAD DE CONDUCCIÓN ═══ */}
      <Section>
        <span className="dp-eyebrow">SEGURIDAD DE CONDUCCIÓN</span>
        <h2 className="text-[17px] font-semibold text-white mt-1">
          Velocidad máxima <span className="text-[#58a6ff] text-base font-bold ml-1.5">{speed} RPM</span>
        </h2>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          disabled={!canDrive}
          className="dp-slider mt-2"
        />
        <p className="text-[#8b949e]/70 text-[11px] mt-1.5">
          Avance máx: 30 RPM · Retroceso: 15 RPM · Giro: 15 RPM
        </p>
        <div className="flex justify-between text-[#8b949e]/50 text-[10px] mt-1">
          <span>0 RPM</span>
          <span>30 RPM</span>
        </div>
      </Section>

      {/* ═══ STM32 ESTADO ═══ */}
      <Section>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="dp-eyebrow">STM32</span>
            <h2 className="text-[17px] font-semibold text-white mt-1">Estado</h2>
          </div>
        </div>

        <div className="bg-[#0d1117]/60 border border-[#30363d]/40 rounded-lg py-1">
          <StatusRow label="Último comando" value={status.last_command} mono />
          <StatusRow label="Ultrasónico" value={status.ultrasonic_block} warn={status.ultrasonic_block !== "LIBRE"} />
          <StatusRow label="Puerto" value={status.serial_port || "--"} mono />
        </div>
      </Section>

      {/* ═══ BOTONES DE CONTROL ═══ */}
      <div className="space-y-2 pt-2">
        {!hasControl ? (
          <button
            onClick={onClaimControl}
            className="w-full px-4 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white text-sm font-bold rounded-lg transition-colors"
          >
            <i className="fas fa-hand-pointer mr-2" />
            Tomar control
          </button>
        ) : (
          <>
            <button
              onClick={onReleaseControl}
              className="w-full px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-sm font-semibold rounded-lg border border-[#30363d] transition-colors"
            >
              <i className="fas fa-hand-paper mr-2" />
              Liberar control
            </button>
            <button
              onClick={onEmergencyStop}
              className="w-full bg-linear-to-br from-[#b62324] to-[#d23f4a] text-white border border-[#ff5050]/50 rounded-[10px] py-3 cursor-pointer text-center shadow-[0_4px_12px_rgba(218,54,51,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(218,54,51,0.4)] active:translate-y-0"
            >
              <strong className="block text-sm tracking-wide font-bold">EMERGENCY STOP</strong>
              <span className="block text-[11px] opacity-90 mt-0.5">Detener inmediatamente</span>
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {controlError && (
        <div className="flex gap-2.5 bg-[#d29922]/12 border border-[#d29922]/35 rounded-lg p-3 text-[#d29922]">
          <i className="fas fa-exclamation-triangle text-lg mt-0.5" />
          <div>
            <strong className="block text-xs">{controlError}</strong>
          </div>
        </div>
      )}

      {/* Nota */}
      <div className="text-xs text-[#8b949e] leading-relaxed pt-2 border-t border-[#21262d]">
        {canDrive ? (
          <>
            <i className="fas fa-keyboard text-[#58a6ff] mr-1" />
            Teclado activo · W/A/S/D para mover · F para neutro
          </>
        ) : hasControl ? (
          <>
            <i className="fas fa-lock text-[#d29922] mr-1" />
            Movimiento bloqueado: MODE {status.robot_mode}
          </>
        ) : (
          <>
            <i className="fas fa-info-circle text-[#484f58] mr-1" />
            Toma el control para habilitar el teclado
          </>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#161b22]/55 border border-[#30363d]/40 rounded-xl p-3.5 px-4">
      {children}
    </div>
  );
}

function StatusItem({ label, value, connected, warn }: { label: string; value: string; connected: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#30363d]/25 border border-[#30363d]/40 rounded-lg text-xs flex-1 min-w-32.5">
      <span className={`w-2 h-2 rounded-full shrink-0 ${
        warn 
          ? "bg-[#d29922] shadow-[0_0_6px_rgba(210,153,34,0.6)]" 
          : connected 
            ? "bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.6)]" 
            : "bg-[#6e7681]"
      }`} />
      <span className="text-[#8b949e]/80 font-medium">{label}</span>
      <span className="text-white font-semibold ml-auto truncate">{value}</span>
    </div>
  );
}

function StatusRow({ label, value, warn, mono }: { label: string; value: string; warn?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 border-b border-[#30363d]/25 last:border-b-0">
      <span className="text-[#8b949e]/70 text-xs">{label}</span>
      <span className={`text-xs font-semibold ${mono ? "font-mono" : ""} ${warn ? "text-[#d29922]" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

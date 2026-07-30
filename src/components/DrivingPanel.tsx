// ─── DrivingPanel ────────────────────────────────────────────────────────────
// Panel de conducción para modo teclado (WASD)

import { useState, useRef, useEffect } from "react";
import type { RobotStatus } from "../types/robot";

interface DrivingPanelProps {
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
}

export function DrivingPanel({
  status,
  hasControl,
  canDrive,
  speed,
  controlError,
  serialLog,
  onSpeedChange,
  onClaimControl,
  onReleaseControl,
  onEmergencyStop,
  onClearLog,
  onSendSerialCommand,
}: DrivingPanelProps) {
  const [commandInput, setCommandInput] = useState("");
  const logRef = useRef<HTMLPreElement>(null);

  // Auto-scroll al final del log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [serialLog]);

  const handleSubmitCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (cmd && hasControl) {
      onSendSerialCommand(cmd);
      setCommandInput("");
    }
  };

  return (
    <div className="space-y-4">
      {/* ═══ INDICADORES DE ESTADO ═══ */}
      {/* <div className="grid grid-cols-2 gap-2">
        <StatusItem label="Backend" value={isConnected ? "Conectado" : "Desconectado"} connected={isConnected} />
        <StatusItem label="STM32" value={status.serial_connected ? "Conectada" : "Desconectada"} connected={status.serial_connected} />
        <StatusItem label="Modo" value={status.robot_mode} connected={status.robot_mode !== "DESCONOCIDO"} />
        <StatusItem label="Failsafe" value={status.failsafe ? "ACTIVO" : "INACTIVO"} connected={!status.failsafe} warn={status.failsafe} />
      </div> */}

      {/* ═══ CONTROL EN VIVO ═══ */}
      {/* <Section>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="dp-eyebrow">CONTROL EN VIVO</span>
            <h2 className="text-[17px] font-semibold text-white mt-1">Teclado WASD</h2>
          </div>
          <button
            onClick={onCycleMode}
            disabled={!hasControl}
            className="px-3 py-1.5 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg border border-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cambiar modo
          </button>
        </div>

        <div className="flex flex-col items-center gap-1.5 my-4">
          <KeyButton label="W" active={false} disabled={!canDrive} />
          <div className="flex gap-1.5">
            <KeyButton label="A" active={false} disabled={!canDrive} />
            <KeyButton label="S" active={false} disabled={!canDrive} />
            <KeyButton label="D" active={false} disabled={!canDrive} />
          </div>
        </div>

        <p className="text-[#8b949e]/70 text-[11px] text-center leading-relaxed">
          Mantén presionadas las teclas para mover · F para neutro
        </p>
      </Section> */}

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

      {/* ═══ REGISTRO SERIAL ═══ */}
      <Section>
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="dp-eyebrow">STM32</span>
            <h2 className="text-[17px] font-semibold text-white mt-1">Registro serial</h2>
          </div>
          <button
            onClick={onClearLog}
            className="px-2.5 py-1 text-[11px] text-[#8b949e] hover:text-[#c9d1d9] bg-transparent hover:bg-[#21262d] rounded border border-transparent hover:border-[#30363d] transition-colors"
          >
            <i className="fas fa-trash-alt mr-1" />
            Limpiar
          </button>
        </div>

        {/* Input de comando serial */}
        <form onSubmit={handleSubmitCommand} className="flex gap-2 mb-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="SP 30 30"
            maxLength={63}
            disabled={!hasControl}
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] placeholder-[#484f58] focus:border-[#58a6ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!hasControl || !commandInput.trim()}
            className="px-3 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg border border-[#30363d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>

        {/* Display del log */}
        <pre
          ref={logRef}
          className="min-h-40 max-h-[50vh] overflow-y-auto bg-[#0d1117] border border-[#30363d]/40 rounded-lg p-2.5 text-[11px] font-mono text-[#8b949e] leading-relaxed whitespace-pre-wrap break-all"
        >
          {serialLog.length > 0 ? serialLog.join("\n") : "Esperando datos..."}
        </pre>
      </Section>
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

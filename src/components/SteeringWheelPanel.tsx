// ─── SteeringWheelPanel ──────────────────────────────────────────────────────
// Panel de conducción completo (RD2 Teleop) - Replica el diseño del mockup

import { useState } from "react";

interface SteeringWheelPanelProps {
  isConnected: boolean;
  hasControl: boolean;
  canDrive: boolean;
  speed: number;
  controlError: string | null;
  onSpeedChange: (speed: number) => void;
  onClaimControl: () => void;
  onReleaseControl: () => void;
  onEmergencyStop: () => void;
}

export function SteeringWheelPanel({
  isConnected,
  hasControl,
  canDrive,
  controlError,
  onSpeedChange,
  onClaimControl,
  onReleaseControl,
  onEmergencyStop,
}: SteeringWheelPanelProps) {
  const [drivingMode, setDrivingMode] = useState<"RC" | "TELEOP">("RC");
  const [direction, setDirection] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(100);
  const [gear, setGear] = useState<"retro" | "neutral" | "avance">("neutral");
  const [maxSpeed, setMaxSpeed] = useState(5);
  const [auxState, setAuxState] = useState({
    luzFrontal: false,
    guinadorIzq: false,
    guinadorDer: false,
    balizas: false,
    destellador: false,
    microfono: false,
  });
  const [hornSound, setHornSound] = useState("normal");

  const toggleAux = (key: keyof typeof auxState) => {
    setAuxState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* ═══ INDICADORES DE ESTADO ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatusItem label="Mando" value="Sin mando" connected={false} />
        <StatusItem label="STM32" value="Conectada" connected={isConnected} />
        <StatusItem label="Canal" value="Active" connected={isConnected} />
        <StatusItem label="Micrófono" value="Inactivo" connected={auxState.microfono} />
      </div>

      {/* ═══ CONTROL EN VIVO ═══ */}
      <Section>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="dp-eyebrow">CONTROL EN VIVO</span>
            <h2 className="text-[17px] font-semibold text-white mt-1">Conducción</h2>
          </div>
          <div className="flex bg-[#0d1117]/60 border border-[#30363d]/40 rounded-lg p-[3px] gap-[2px]">
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                drivingMode === "RC"
                  ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                  : "text-[#8b949e]/70 hover:text-[#c9d1d9]"
              }`}
              onClick={() => setDrivingMode("RC")}
            >
              RC
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                drivingMode === "TELEOP"
                  ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                  : "text-[#8b949e]/70 hover:text-[#c9d1d9]"
              }`}
              onClick={() => setDrivingMode("TELEOP")}
            >
              TELEOP
            </button>
          </div>
        </div>

        {/* Dirección */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <label className="text-[#8b949e]/80 text-[11px] font-medium tracking-wide">Dirección</label>
            <span className="text-[#58a6ff] text-sm font-bold tabular-nums">{direction}</span>
          </div>
          <input
            type="range"
            min={-1000}
            max={1000}
            value={direction}
            onChange={(e) => setDirection(Number(e.target.value))}
            disabled={!canDrive}
            className="dp-slider"
          />
          <div className="flex justify-between text-[#8b949e]/50 text-[10px] mt-1">
            <span>-1000</span>
            <span>1000</span>
          </div>
        </div>

        {/* Acelerador y Freno */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[#8b949e]/80 text-[11px] font-medium tracking-wide">Acelerador</label>
              <span className="text-[#58a6ff] text-sm font-bold tabular-nums">{throttle}%</span>
            </div>
            <div className="w-full h-2 bg-[#30363d]/50 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#1f6feb] to-[#58a6ff] shadow-[0_0_8px_rgba(88,166,255,0.4)] transition-all"
                style={{ width: `${throttle}%` }}
              />
            </div>
            <span className="text-[#8b949e]/60 text-[10px] mt-1 block">{throttle * 10} / 1000</span>
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="text-[#8b949e]/80 text-[11px] font-medium tracking-wide">Freno</label>
              <span className="text-[#58a6ff] text-sm font-bold tabular-nums">{brake}%</span>
            </div>
            <div className="w-full h-2 bg-[#30363d]/50 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#da3633] to-[#ff5050] shadow-[0_0_8px_rgba(255,80,80,0.4)] transition-all"
                style={{ width: `${brake}%` }}
              />
            </div>
            <span className="text-[#8b949e]/60 text-[10px] mt-1 block">{brake * 10} / 1000</span>
          </div>
        </div>

        {/* Sliders para acelerador y freno */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            type="range"
            min={0}
            max={100}
            value={throttle}
            onChange={(e) => setThrottle(Number(e.target.value))}
            disabled={!canDrive}
            className="dp-slider"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={brake}
            onChange={(e) => setBrake(Number(e.target.value))}
            disabled={!canDrive}
            className="dp-slider"
          />
        </div>

        {/* Selector de marcha */}
        <div>
          <label className="text-[#8b949e]/80 text-[11px] font-medium tracking-wide mb-1.5 block">
            Selector de marcha
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <GearButton
              active={gear === "retro"}
              onClick={() => setGear("retro")}
              hotkey="LB"
              label="Retro"
            />
            <GearButton
              active={gear === "neutral"}
              onClick={() => setGear("neutral")}
              label="Neutral"
            />
            <GearButton
              active={gear === "avance"}
              onClick={() => setGear("avance")}
              hotkey="RB"
              label="Avance"
            />
          </div>
          <p className="text-[#8b949e]/70 text-[11px] mt-1.5 leading-relaxed">
            Las marchas se enclavan en la STM32. LB = RD selecciona neutral.
          </p>
        </div>
      </Section>

      {/* ═══ SEGURIDAD DE CONDUCCIÓN ═══ */}
      <Section>
        <span className="dp-eyebrow">SEGURIDAD DE CONDUCCIÓN</span>
        <h2 className="text-[17px] font-semibold text-white mt-1">
          Velocidad máxima <span className="text-[#d29922] text-base font-bold ml-1.5">{maxSpeed}%</span>
        </h2>
        <input
          type="range"
          min={0}
          max={100}
          value={maxSpeed}
          onChange={(e) => {
            setMaxSpeed(Number(e.target.value));
            onSpeedChange(Math.round(Number(e.target.value) * 0.3));
          }}
          disabled={!canDrive}
          className="dp-slider mt-2"
        />
        <p className="text-[#8b949e]/70 text-[11px] mt-1.5">
          Limita proporciones frente a la idea del acelerador
        </p>
        <div className="flex justify-between text-[#8b949e]/50 text-[10px] mt-1">
          <span>0% detenido</span>
          <span>100% máximo</span>
        </div>
      </Section>

      {/* ═══ AUXILIARES STM32 ═══ */}
      <Section>
        <span className="dp-eyebrow">AUXILIARES STM32</span>
        <h2 className="text-[17px] font-semibold text-white mt-1 mb-3">Luces, guiñadores y puerta</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          <AuxButton
            active={auxState.luzFrontal}
            onClick={() => toggleAux("luzFrontal")}
            hotkey="Start"
            label="Luz frontal"
          />
          <AuxButton
            active={auxState.guinadorIzq}
            onClick={() => toggleAux("guinadorIzq")}
            hotkey="Y"
            label="Guiñador izq."
          />
          <AuxButton
            active={auxState.guinadorDer}
            onClick={() => toggleAux("guinadorDer")}
            hotkey="B"
            label="Guiñador der."
          />
          <AuxButton
            active={auxState.balizas}
            onClick={() => toggleAux("balizas")}
            hotkey="Back"
            label="Balizas"
          />
          <AuxButton
            active={auxState.destellador}
            onClick={() => toggleAux("destellador")}
            hotkey="R3"
            label="Destellador"
          />
          <AuxButton
            active={auxState.microfono}
            onClick={() => toggleAux("microfono")}
            icon="fas fa-microphone"
            label="Micrófono"
          />
          <AuxButton
            active={false}
            onClick={() => {}}
            hotkey="A"
            label="Abrir puerta"
          />
          <AuxButton
            active={false}
            onClick={() => {}}
            hotkey="X"
            label="Cerrar puerta"
          />
        </div>

        <p className="text-[#d29922] text-[11px] font-medium mt-2">Pruebas físicas restantes</p>
        <p className="text-[#8b949e]/60 font-mono text-[10px] mt-1">
          Luz: {auxState.luzFrontal ? "ON" : "OFF"} · Destellador: {auxState.destellador ? "ON" : "OFF"} · Izq: {auxState.guinadorIzq ? "ON" : "OFF"} · Der: {auxState.guinadorDer ? "ON" : "OFF"} · Balizas: {auxState.balizas ? "ON" : "OFF"} · Mic: {auxState.microfono ? "ON" : "OFF"} · Puerta: OFF
        </p>
      </Section>

      {/* ═══ AUDIO JETSON ═══ */}
      <Section>
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="dp-eyebrow">AUDIO JETSON</span>
            <h2 className="text-[17px] font-semibold text-white mt-1">
              Bocina <span className="bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-1.5 align-middle">Listo</span>
            </h2>
          </div>
        </div>
        
        <label className="text-[#8b949e]/80 text-[11px] font-medium tracking-wide block mb-1.5">
          Sonido seleccionado
        </label>
        <select
          value={hornSound}
          onChange={(e) => setHornSound(e.target.value)}
          className="w-full px-3 py-2 bg-[#0d1117]/60 border border-[#30363d]/50 rounded-lg text-[#c9d1d9] text-[13px] cursor-pointer mb-1.5 focus:outline-none focus:border-[#58a6ff]/60"
        >
          <option value="normal">Bocina normal</option>
          <option value="suave">Bocina suave</option>
          <option value="aguda">Bocina aguda</option>
        </select>
        
        <button className="w-full flex items-center justify-start gap-2 px-3 py-2.5 bg-[#0d1117]/60 border border-[#30363d]/50 rounded-lg text-[#c9d1d9] text-[13px] font-medium hover:border-[#58a6ff]/40 transition-all mt-2">
          <span className="inline-block bg-[#30363d]/60 text-white px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#8b949e]/30 min-w-[24px] text-center">LS</span>
          Mantener bocina
        </button>
      </Section>

      {/* ═══ MANDO USB ═══ */}
      <Section>
        <p className="text-[#8b949e]/60 font-mono text-[10px]">
          Mando activo. Mantén esta pestaña abierta y visible.
        </p>
        
        <div className="bg-[#0d1117]/60 border border-[#30363d]/40 rounded-lg p-3 mt-2">
          <div className="text-white text-[13px] font-medium mb-1.5">
            24c4-5b03-Thrustmaster Ferrari 458 Racing Wheel
          </div>
          <div className="flex gap-2 font-mono text-[11px] leading-relaxed flex-wrap">
            <span className="text-[#8b949e]/60 font-semibold min-w-[60px]">Ejes:</span>
            <span className="text-[#c9d1d9] break-words flex-1">0:-0.02 · 1:+0.00 · 2:+0.00 · 3:-0.00 · 4:-0.00 · 5:-0.00 · 6:-0.00 · 7:-0.01</span>
          </div>
          <div className="flex gap-2 font-mono text-[11px] leading-relaxed flex-wrap mt-1">
            <span className="text-[#8b949e]/60 font-semibold min-w-[60px]">Botones:</span>
            <span className="text-[#c9d1d9] break-words flex-1">0:0.00 · 1:0.00 · 2:0.00 · 3:0.00</span>
          </div>
        </div>

        <button className="flex items-center gap-2 w-full text-[#8b949e]/80 text-xs py-1.5 hover:text-[#58a6ff] transition-colors mt-2">
          <i className="fas fa-cog" />
          Configurar ejes y botones
          <i className="fas fa-chevron-right ml-auto" />
        </button>
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
          <StatusRow label="Modo" value="TELEDIRIGIDO" />
          <StatusRow label="Failsafe" value="ACTIVO" warn />
          <StatusRow label="Ultrasónico" value="LIBRE" />
          <StatusRow label="Último comando" value="TELE 0 0" mono />
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
              className="w-full bg-gradient-to-br from-[#b62324] to-[#d23f4a] text-white border border-[#ff5050]/50 rounded-[10px] py-3 cursor-pointer text-center shadow-[0_4px_12px_rgba(218,54,51,0.3)] transition-all hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(218,54,51,0.4)] active:translate-y-0"
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

function StatusItem({ label, value, connected }: { label: string; value: string; connected: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#30363d]/25 border border-[#30363d]/40 rounded-lg text-xs flex-1 min-w-[130px]">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? "bg-[#3fb950] shadow-[0_0_6px_rgba(63,185,80,0.6)]" : "bg-[#6e7681]"}`} />
      <span className="text-[#8b949e]/80 font-medium">{label}</span>
      <span className="text-white font-semibold ml-auto">{value}</span>
    </div>
  );
}

function GearButton({ active, onClick, hotkey, label }: { active: boolean; onClick: () => void; hotkey?: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
        active
          ? "bg-[#58a6ff]/15 border-[#58a6ff]/60 text-[#58a6ff] border"
          : "bg-[#0d1117]/60 border-[#30363d]/50 text-[#c9d1d9] border hover:border-[#58a6ff]/40 hover:text-white"
      }`}
    >
      {hotkey && (
        <span className="inline-block bg-[#30363d]/60 text-white px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#8b949e]/30 min-w-[24px] text-center">
          {hotkey}
        </span>
      )}
      {label}
    </button>
  );
}

function AuxButton({ active, onClick, hotkey, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  hotkey?: string; 
  icon?: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all text-left ${
        active
          ? "bg-[#58a6ff]/20 border-[#58a6ff]/60 text-[#58a6ff] border"
          : "bg-[#0d1117]/60 border-[#30363d]/50 text-[#c9d1d9] border hover:border-[#58a6ff]/40"
      }`}
    >
      {hotkey ? (
        <span className="inline-block bg-[#30363d]/60 text-white px-1.5 py-0.5 rounded text-[10px] font-bold border border-[#8b949e]/30 min-w-[24px] text-center">
          {hotkey}
        </span>
      ) : icon ? (
        <i className={icon} />
      ) : null}
      {label}
    </button>
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

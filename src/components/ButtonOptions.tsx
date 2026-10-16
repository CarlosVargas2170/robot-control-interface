// ─── ButtonOptions — floating overlay toolbar ─────────────────────────────────

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { CameraInfo } from "../types/camera";
import type { GraphType } from "../types/graph";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ButtonOptionsProps {
  /** Camera list fetched from the backend */
  cameras: CameraInfo[];
  /** IDs of cameras currently visible in the grid */
  activeCameras: string[];
  /** Called when a camera checkbox is toggled */
  onToggleCamera?: (cameraId: string, active: boolean) => void;
  /** Which graph widgets are visible */
  visibleGraphs?: Set<GraphType>;
  /** Called when a graph checkbox is toggled */
  onToggleGraph?: (type: GraphType, active: boolean) => void;
  /** Whether edit mode (drag/resize enabled) is active */
  editMode?: boolean;
  /** Called when the edit mode button is clicked */
  onToggleEditMode?: () => void;
  /** Whether the driving panel is visible */
  drivingPanel?: boolean;
  /** Called when the driving panel checkbox is toggled */
  onToggleDrivingPanel?: (active: boolean) => void;
  /** Current control type (teclado/volante/mando) */
  controlType?: string;
  /** Called when control type changes */
  onControlTypeChange?: (type: string) => void;
}

interface ButtonOptionProps {
  icon: string;
  tooltip: string;
  variant?: "cam";
  onClick?: () => void;
  children?: ReactNode;
  /** Al cambiar, fuerza el cierre del dropdown. */
  closeToken?: number;
}

interface DropdownSubmenuProps {
  icon: string;
  label: string;
  children: ReactNode;
}

// ─── DROPDOWN SUBMENU (internal) ─────────────────────────────────────────────

function DropdownSubmenu({ icon, label, children }: DropdownSubmenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className={[
          "flex cursor-pointer items-center gap-2.5 px-5 py-2.5",
          "text-sm text-[#c9d1d9] select-none",
          "transition-colors duration-150",
          "hover:bg-[#58a6ff]/8",
        ].join(" ")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <i className={`${icon} w-3.75 text-[#58a6ff]`} />
        <span className="flex-1">{label}</span>
        <span
          className={[
            "text-[10px] text-[#555] transition-transform duration-200",
            open && "rotate-90",
          ].join(" ")}
        >
          <i className="fas fa-chevron-right" />
        </span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── BUTTON OPTION ───────────────────────────────────────────────────────────

function ButtonOption({
  icon,
  tooltip,
  variant,
  onClick,
  children,
  closeToken,
}: ButtonOptionProps) {
  const [open, setOpen] = useState(false);
  const hasDropdown = !!children;

  // Cerrar el dropdown cuando cambia closeToken
  useEffect(() => {
    if (closeToken !== undefined && closeToken > 0) {
      setOpen(false);
    }
  }, [closeToken]);

  const btn = (
    <button
      className={[
        "group relative flex h-w-9.5 w-9.5 items-center justify-center",
        "cursor-pointer rounded-lg border-none bg-transparent text-lg",
        "text-[#c9d1d9]",
        "transition-all duration-200",
        "hover:scale-105 hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
        "active:scale-95",
        variant === "cam" && "text-[#58a6ff]",
        variant === "cam" &&
          "hover:bg-[#58a6ff]/20 hover:shadow-[0_0_20px_rgba(88,166,255,0.15)]",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        if (hasDropdown) setOpen((prev) => !prev);
        onClick?.();
      }}
    >
      <i className={icon} />
      <span
        className={[
          "pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2",
          "whitespace-nowrap rounded-md border border-[#30363d]",
          "bg-[#1c2333] px-2.5 py-0.5 text-[10px] text-[#8b949e]",
          "opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100",
        ].join(" ")}
      >
        {tooltip}
      </span>
    </button>
  );

  if (!hasDropdown) return btn;

  return (
    <div className="relative">
      {btn}
      {open && (
        <div
          className={[
            "absolute right-0 z-2000",
            "top-[calc(100%+12px)] min-w-75",
            "rounded-2xl border border-[#30363d]/30",
            "bg-[#0a0e14]/60 py-3 backdrop-blur-md",
            "shadow-[0_12px_48px_rgba(0,0,0,0.7)]",
          ].join(" ")}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── DIVIDER (internal) ──────────────────────────────────────────────────────

function Divider() {
  return <div className="h-7 w-px bg-[#30363d]" />;
}

// ─── DROPDOWN ITEM HELPERS (internal) ────────────────────────────────────────

function DropdownCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-2.5 px-5 py-2.5",
        "text-sm text-[#c9d1d9] select-none",
        "transition-colors duration-150 hover:bg-[#58a6ff]/8",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.75 w-3.75 shrink-0 cursor-pointer accent-[#58a6ff]"
      />
      <span className="flex-1">{label}</span>
    </label>
  );
}

function DropdownRadio({
  label,
  value,
  name,
  checked,
  disabled,
  onChange,
  showConfig,
}: {
  label: string;
  value: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: string) => void;
  showConfig?: boolean;
}) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center justify-between px-5 py-2.5",
        "text-sm text-[#c9d1d9] select-none",
        "transition-colors duration-150 hover:bg-[#58a6ff]/8",
      ].join(" ")}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-3.75 w-3.75 shrink-0 cursor-pointer accent-[#58a6ff]"
        />
        {label}
      </span>
      {showConfig && (
        <span className="cursor-pointer text-[#8b949e] hover:text-[#58a6ff]">
          ⚙
        </span>
      )}
    </label>
  );
}

function DropdownDivider() {
  return <div className="mx-4 my-1 border-t border-[#30363d]/40" />;
}

// ─── BUTTON OPTIONS (default export) ─────────────────────────────────────────

export default function ButtonOptions({
  cameras,
  activeCameras,
  onToggleCamera,
  visibleGraphs = new Set(),
  onToggleGraph,
  editMode = false,
  onToggleEditMode,
  drivingPanel = false,
  onToggleDrivingPanel,
  controlType = "teclado",
  onControlTypeChange,
}: ButtonOptionsProps) {
  // ── Cerrar dropdown Ajustes al abrir el panel de conducción ────────────────
  const [settingsCloseToken, setSettingsCloseToken] = useState(0);
  const prevDrivingPanel = useRef(drivingPanel);
  useEffect(() => {
    if (drivingPanel && !prevDrivingPanel.current) {
      setSettingsCloseToken((t) => t + 1);
    }
    prevDrivingPanel.current = drivingPanel;
  }, [drivingPanel]);

  // ── Helper: is a graph visible? ─────────────────────────────────────────────
  const isGraphVisible = (type: GraphType) => visibleGraphs.has(type);
  const handleGraphChange = useCallback(
    (type: GraphType) => (active: boolean) => onToggleGraph?.(type, active),
    [onToggleGraph],
  );

  // ── Fallback local state (used when onToggleGraph is not wired yet) ──────────
  const [packetLossLocal, setPacketLoss] = useState(true);
  const [aceleracionLocal, setAceleracion] = useState(false);
  const [gpsLocal, setGps] = useState(false);
  const [lidarLocal, setLidar] = useState(false);
  const [radarFrontalLocal, setRadarFrontal] = useState(false);
  const [fusionLidarRadarLocal, setFusionLidarRadar] = useState(false);
  const [frenoManoLocal, setFrenoMano] = useState(false);
  const [wasdKeysLocal, setWasdKeys] = useState(true);
  const [controlMaster, setControlMaster] = useState(false);

  // ── Use visibleGraphs when onToggleGraph is provided, else local fallback ───
  const isWired = !!onToggleGraph;
  const g = (type: GraphType, local: boolean) =>
    isWired ? isGraphVisible(type) : local;
  const h = (type: GraphType, localSet: (v: boolean) => void) =>
    isWired ? handleGraphChange(type) : localSet;

  // ── Camera-aware helpers ──
  const isCameraActive = (id: string) => activeCameras.includes(id);
  const hasCameras = cameras.length > 0;

  return (
    <div
      className={[
        "pointer-events-auto absolute top-6 right-6 z-1000",
        "flex items-center gap-2.5",
        "rounded-xl bg-[#0d1117]/45 px-3.5 py-2 backdrop-blur-sm",
      ].join(" ")}
    >
      {/* ── CÁMARAS (dinámicas) ── */}
      <ButtonOption icon="fas fa-camera" tooltip="Cámaras" variant="cam">
        {hasCameras ? (
          cameras.map((cam) => (
            <DropdownCheckbox
              key={cam.id}
              label={cam.name}
              checked={isCameraActive(cam.id)}
              onChange={(v) => onToggleCamera?.(cam.id, v)}
            />
          ))
        ) : (
          <div className="px-4 py-2 text-[11px] text-[#555]">
            (sin cámaras detectadas)
          </div>
        )}
      </ButtonOption>

      <Divider />

      {/* ── AJUSTES ── */}
      <ButtonOption icon="fas fa-sliders-h" tooltip="Ajustes" closeToken={settingsCloseToken}>
        <DropdownCheckbox
          label="Packet loss"
          checked={g("packetLoss", packetLossLocal)}
          onChange={h("packetLoss", setPacketLoss)}
        />
        <DropdownCheckbox
          label="Aceleración"
          checked={g("accel", aceleracionLocal)}
          onChange={h("accel", setAceleracion)}
        />
        <DropdownCheckbox
          label="GPS"
          checked={g("gps", gpsLocal)}
          onChange={h("gps", setGps)}
        />
        <DropdownCheckbox
          label="LiDAR"
          checked={g("lidar", lidarLocal)}
          onChange={h("lidar", setLidar)}
        />
        <DropdownCheckbox
          label="Radar frontal"
          checked={g("radarFront", radarFrontalLocal)}
          onChange={h("radarFront", setRadarFrontal)}
        />
        <DropdownCheckbox
          label="Fusión LIDAR+Radar"
          checked={g("lidarFusion", fusionLidarRadarLocal)}
          onChange={h("lidarFusion", setFusionLidarRadar)}
        />
        <DropdownCheckbox
          label="Freno de mano"
          checked={g("handbrake", frenoManoLocal)}
          onChange={h("handbrake", setFrenoMano)}
        />
        <DropdownCheckbox
          label="Teclas WASD"
          checked={g("wasdKeys", wasdKeysLocal)}
          onChange={h("wasdKeys", setWasdKeys)}
        />
        <DropdownCheckbox
          label="Panel de conducción"
          checked={drivingPanel}
          onChange={(v) => onToggleDrivingPanel?.(v)}
        />

        <DropdownDivider />

        {/* Controles submenu */}
        <DropdownSubmenu icon="fas fa-gamepad" label="Controles">
          <DropdownCheckbox
            label="Activar control remoto"
            checked={controlMaster}
            onChange={setControlMaster}
          />
          <DropdownDivider />
          <DropdownRadio
            label="Teclado"
            value="teclado"
            name="controlType"
            checked={controlType === "teclado"}
            disabled={!controlMaster}
            onChange={(v) => onControlTypeChange?.(v)}
            showConfig
          />
          <DropdownRadio
            label="Volante"
            value="volante"
            name="controlType"
            checked={controlType === "volante"}
            disabled={!controlMaster}
            onChange={(v) => onControlTypeChange?.(v)}
            showConfig
          />
          <DropdownRadio
            label="Mando"
            value="mando"
            name="controlType"
            checked={controlType === "mando"}
            disabled={!controlMaster}
            onChange={(v) => onControlTypeChange?.(v)}
            showConfig
          />
        </DropdownSubmenu>

        {/* Aplicaciones submenu */}
        <DropdownSubmenu icon="fas fa-th-large" label="Aplicaciones">
          <DropdownCheckbox
            label="Mesero Robot"
            checked={false}
            onChange={() => {}}
          />
        </DropdownSubmenu>
      </ButtonOption>

      <Divider />

      {/* ── MODO EDICIÓN ── */}
      <ButtonOption
        icon={editMode ? "fas fa-unlock" : "fas fa-lock"}
        tooltip={editMode ? "Bloquear" : "Edición"}
        onClick={() => onToggleEditMode?.()}
      />

      <Divider />

      {/* ── LAYOUTS ── */}
      <ButtonOption icon="fas fa-edit" tooltip="Edición">
        <div className="px-4 py-1 text-[11px] text-[#555]">
          (sin layouts guardados)
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-[#30363d]/40 px-4 pt-3 pb-1">
          <button
            className={[
              "flex h-8.5 w-8.5 items-center justify-center",
              "cursor-pointer rounded-lg border-none bg-transparent",
              "text-sm text-[#8b949e] transition-all duration-200",
              "hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
            ].join(" ")}
            title="Guardar layout actual"
          >
            <i className="fas fa-save" />
          </button>
          <button
            className={[
              "flex h-8.5 w-8.5 items-center justify-center",
              "cursor-pointer rounded-lg border-none bg-transparent",
              "text-sm text-[#8b949e] transition-all duration-200",
              "hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
            ].join(" ")}
            title="Crear nuevo layout"
          >
            <i className="fas fa-plus-circle" />
          </button>
        </div>
      </ButtonOption>
    </div>
  );
}

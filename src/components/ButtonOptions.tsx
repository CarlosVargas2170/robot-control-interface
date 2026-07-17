// ─── ButtonOptions — floating overlay toolbar ─────────────────────────────────

import { useState, type ReactNode } from "react";
import type { CameraInfo } from "../types/camera";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ButtonOptionsProps {
  /** Camera list fetched from the backend */
  cameras: CameraInfo[];
  /** IDs of cameras currently visible in the grid */
  activeCameras: string[];
  /** Called when a camera checkbox is toggled */
  onToggleCamera?: (cameraId: string, active: boolean) => void;
}

interface ButtonOptionProps {
  icon: string;
  tooltip: string;
  variant?: "cam";
  onClick?: () => void;
  children?: ReactNode;
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
}: ButtonOptionProps) {
  const [open, setOpen] = useState(false);
  const hasDropdown = !!children;

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
}: ButtonOptionsProps) {
  // ── Internal settings state ──
  const [packetLoss, setPacketLoss] = useState(true);
  const [aceleracion, setAceleracion] = useState(false);
  const [gps, setGps] = useState(false);
  const [lidar, setLidar] = useState(false);
  const [radarFrontal, setRadarFrontal] = useState(false);
  const [fusionLidarRadar, setFusionLidarRadar] = useState(false);
  const [frenoMano, setFrenoMano] = useState(false);
  const [drivingPanel, setDrivingPanel] = useState(false);
  const [controlMaster, setControlMaster] = useState(false);
  const [controlType, setControlType] = useState("teclado");

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
      <ButtonOption icon="fas fa-sliders-h" tooltip="Ajustes">
        <DropdownCheckbox
          label="Packet loss"
          checked={packetLoss}
          onChange={setPacketLoss}
        />
        <DropdownCheckbox
          label="Aceleración"
          checked={aceleracion}
          onChange={setAceleracion}
        />
        <DropdownCheckbox label="GPS" checked={gps} onChange={setGps} />
        <DropdownCheckbox
          label="LiDAR"
          checked={lidar}
          onChange={setLidar}
        />
        <DropdownCheckbox
          label="Radar frontal"
          checked={radarFrontal}
          onChange={setRadarFrontal}
        />
        <DropdownCheckbox
          label="Fusión LIDAR+Radar"
          checked={fusionLidarRadar}
          onChange={setFusionLidarRadar}
        />
        <DropdownCheckbox
          label="Freno de mano"
          checked={frenoMano}
          onChange={setFrenoMano}
        />
        <DropdownCheckbox
          label="Panel de conducción"
          checked={drivingPanel}
          onChange={setDrivingPanel}
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
            onChange={setControlType}
            showConfig
          />
          <DropdownRadio
            label="Volante"
            value="volante"
            name="controlType"
            checked={controlType === "volante"}
            disabled={!controlMaster}
            onChange={setControlType}
            showConfig
          />
          <DropdownRadio
            label="Mando"
            value="mando"
            name="controlType"
            checked={controlType === "mando"}
            disabled={!controlMaster}
            onChange={setControlType}
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
        icon="fas fa-lock"
        tooltip="Edición"
        onClick={() => {
          console.log("Edit mode toggled");
        }}
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

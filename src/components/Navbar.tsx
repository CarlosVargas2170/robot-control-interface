// ─── Navbar ───────────────────────────────────────────────────────────────────
// Barra de navegación superior fija y responsiva

import { useState, useEffect, useRef } from "react";
import type { CameraInfo } from "../types/camera";
import type { GraphType } from "../types/graph";
import type { RobotStatus } from "../types/robot";
import {
  NavbarStatusPills,
  NavbarActions,
  NavbarCamerasMenu,
  NavbarSettingsMenu,
  NavbarLayoutsMenu,
  NavbarModeSelect,
  DropdownButton,
} from "./navbar/index";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface NavbarProps {
  status: RobotStatus;
  isConnected: boolean;
  hasControl: boolean;
  cameras: CameraInfo[];
  activeCameras: string[];
  onToggleCamera?: (cameraId: string, active: boolean) => void;
  visibleGraphs?: Set<GraphType>;
  onToggleGraph?: (type: GraphType, active: boolean) => void;
  editMode?: boolean;
  onToggleEditMode?: () => void;
  drivingPanel?: boolean;
  onToggleDrivingPanel?: (active: boolean) => void;
  controlType?: string;
  onControlTypeChange?: (type: string) => void;
  onClaimControl?: () => void;
  onReleaseControl?: () => void;
  onEmergencyStop?: () => void;
  currentMode?: string;
  onSetMode?: (mode: string) => void;
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────

export function Navbar({
  status,
  isConnected,
  hasControl,
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
  onClaimControl,
  onReleaseControl,
  onEmergencyStop,
  currentMode = "DESCONOCIDO",
  onSetMode,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsCloseToken, setSettingsCloseToken] = useState(0);

  // Al abrir el panel de conducción, cierra el dropdown de Ajustes automáticamente
  const prevDrivingPanel = useRef(drivingPanel);
  useEffect(() => {
    if (drivingPanel && !prevDrivingPanel.current) {
      setSettingsCloseToken((t) => t + 1);
    }
    prevDrivingPanel.current = drivingPanel;
  }, [drivingPanel]);

  const hasActions = !!(onClaimControl || onReleaseControl || onEmergencyStop);

  return (
    <nav className="fixed top-0 left-0 right-0 z-1100 min-h-13.5 flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#0d1117]/80 backdrop-blur-md">
      {/* ── Left: brand ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#1c2333] transition-colors"
          aria-label="Menú"
        >
          <i className={`fas ${menuOpen ? "fa-times" : "fa-bars"} text-sm`} />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <i className="fas fa-robot text-[#58a6ff] text-lg shrink-0" />
          <span className="text-[#f0f6fc] font-semibold text-sm tracking-wide truncate hidden sm:inline">
            SerBot Control
          </span>
        </div>
      </div>

      {/* ── Center: status pills ─────────────────────────────────────────── */}
      <NavbarStatusPills
        isConnected={isConnected}
        hasControl={hasControl}
        status={status}
        variant="desktop"
      />

      {/* ── Right: actions + tool buttons ───────────────────────────────── */}
      <div className="flex items-center gap-1.5">
          {hasActions && (
            <>
              <NavbarActions
                hasControl={hasControl}
                onClaimControl={onClaimControl}
                onReleaseControl={onReleaseControl}
                onEmergencyStop={onEmergencyStop}
              />
              <span className="w-px h-6 bg-[#30363d] mx-0.5" />
            </>
          )}

          {onSetMode && (
            <>
              <NavbarModeSelect
                currentMode={currentMode}
                hasControl={hasControl}
                onSetMode={onSetMode}
              />
              <span className="w-px h-6 bg-[#30363d] mx-0.5" />
            </>
          )}

          <NavbarCamerasMenu
            cameras={cameras}
            activeCameras={activeCameras}
            onToggleCamera={onToggleCamera}
          />

          <NavbarSettingsMenu
            visibleGraphs={visibleGraphs}
            onToggleGraph={onToggleGraph}
            drivingPanel={drivingPanel}
            onToggleDrivingPanel={onToggleDrivingPanel}
            controlType={controlType}
            onControlTypeChange={onControlTypeChange}
            closeToken={settingsCloseToken}
          />

          <DropdownButton
            icon={editMode ? "fas fa-unlock" : "fas fa-lock"}
            tooltip={editMode ? "Bloquear" : "Edición"}
            onClick={() => onToggleEditMode?.()}
          />

          <NavbarLayoutsMenu />
      </div>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="absolute top-13.5 left-0 right-0 bg-[#161b22] border-b border-[#30363d] shadow-lg lg:hidden z-1100">
          <div className="px-4 py-3">
            <NavbarStatusPills
              isConnected={isConnected}
              hasControl={hasControl}
              status={status}
              variant="mobile"
            />
          </div>
        </div>
      )}
    </nav>
  );
}

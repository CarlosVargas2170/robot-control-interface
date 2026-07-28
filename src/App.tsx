import { useState, useEffect, useCallback } from "react";
import GridPanel from "./components/gridPanel/GridPanel";
import Camera from "./components/Camera";
import OverlayGraph from "./components/OverlayGraph";
import { Navbar } from "./components/Navbar";
import { SidePanel } from "./components/SidePanel";
import { useCameras } from "./hooks/useCameras";
import { useSocket } from "./hooks/useSocket";
import { useRobotControl } from "./hooks/useRobotControl";
import { useKeyboard } from "./hooks/useKeyboard";
import { BACKEND_URL, MOCK_MODE } from "./config/backend";
import { MockStream } from "./strategies";
import { WASDKeys } from "./strategies/graphs";
import type { GraphType } from "./types/graph";

// ── Posiciones iniciales de overlays (idénticas al mockup) ──────────────────

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const GRAPH_POSITIONS: Partial<Record<GraphType, OverlayPosition>> = {
  wasdKeys:    { top: 60, left: 20, width: 160, height: 140 },
  accel:       { top: 20, left: 0, width: 220, height: 220 },
  packetLoss:  { top: 80, left: 20, width: 260, height: 160 },
  radarFront:  { top: 20, left: 0, width: 280, height: 220 },
  gps:         { top: 250, left: 0, width: 300, height: 240 },
  lidar:       { top: 280, left: 20, width: 260, height: 260 },
  lidarFusion: { top: 540, left: 20, width: 260, height: 260 },
  steeringWheel: { top: 350, left: 20, width: 220, height: 220 },
  gamepad:     { top: 400, left: 20, width: 200, height: 140 },
  handbrake:   { top: 80, left: 20, width: 120, height: 80 },
};

function App() {
  const { cameras, loading } = useCameras(BACKEND_URL);
  
  // Hooks de comunicación con el backend (no agregan UI)
  const { isConnected, status } = useSocket();
  const {
    hasControl,
    keys,
    speed,
    setSpeed,
    canDrive,
    controlError,
    updateKey,
    claimControl,
    releaseControl,
    emergencyStop,
    cycleMode,
  } = useRobotControl(status);

  // Integrar teclado con el control del robot
  const keyboardKeys = useKeyboard(canDrive);
  
  // Sincronizar teclado con el estado de control
  useEffect(() => {
    if (canDrive) {
      (Object.keys(keyboardKeys) as Array<keyof typeof keyboardKeys>).forEach((key) => {
        if (keyboardKeys[key] !== keys[key]) {
          updateKey(key, keyboardKeys[key]);
        }
      });
    }
  }, [keyboardKeys, keys, canDrive, updateKey]);

  const [activeCameras, setActiveCameras] = useState<string[]>([]);
  const [visibleGraphs, setVisibleGraphs] = useState<Set<GraphType>>(
    new Set<GraphType>(["wasdKeys"]),
  );
  const [editMode, setEditMode] = useState(false);
  const [drivingPanel, setDrivingPanel] = useState(false);
  const [controlType, setControlType] = useState("teclado");

  useEffect(() => {
    if (cameras.length > 0 && activeCameras.length === 0) {
      setActiveCameras(cameras.map((c) => c.id));
    }
  }, [cameras, activeCameras.length]);

  const handleToggleCamera = useCallback(
    (cameraId: string, active: boolean) => {
      setActiveCameras((prev) =>
        active ? [...prev, cameraId] : prev.filter((id) => id !== cameraId),
      );
    },
    [],
  );

  const handleToggleGraph = useCallback((type: GraphType, active: boolean) => {
    setVisibleGraphs((prev) => {
      const next = new Set(prev);
      if (active) next.add(type);
      else next.delete(type);
      return next;
    });
  }, []);

  const handleToggleEditMode = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const handleToggleDrivingPanel = useCallback((active: boolean) => {
    setDrivingPanel(active);
  }, []);

  const handleControlTypeChange = useCallback((type: string) => {
    setControlType(type);
  }, []);

  const visibleCameras = cameras.filter((c) => activeCameras.includes(c.id));
  const gridKey = visibleCameras.map((c) => c.id).join("|");

  return (
    <div className={`relative h-screen w-screen overflow-y-auto bg-[#0d1117] transition-all duration-300 ${drivingPanel ? "pr-[480px]" : ""}`}>
      {/* ── Navbar fija superior ─────────────────────────────────────────── */}
      <Navbar
        status={status}
        isConnected={isConnected}
        hasControl={hasControl}
        cameras={cameras}
        activeCameras={activeCameras}
        onToggleCamera={handleToggleCamera}
        visibleGraphs={visibleGraphs}
        onToggleGraph={handleToggleGraph}
        editMode={editMode}
        onToggleEditMode={handleToggleEditMode}
        drivingPanel={drivingPanel}
        onToggleDrivingPanel={handleToggleDrivingPanel}
        controlType={controlType}
        onControlTypeChange={handleControlTypeChange}
        onClaimControl={claimControl}
        onReleaseControl={releaseControl}
        onEmergencyStop={emergencyStop}
      />

      <div className="pt-[54px]">

      {loading && (
        <div className="flex h-full w-full items-center justify-center text-[#8b949e] text-sm">
          <i className="fas fa-spinner fa-spin mr-2" />
          Detectando cámaras...
        </div>
      )}

      {!loading && visibleCameras.length === 0 && visibleGraphs.size === 0 && (
        <div className="flex h-full w-full items-center justify-center text-[#555] text-sm">
          Sin widgets activos. Actívalos desde el menú{" "}
          <i className="fas fa-camera mx-1 text-[#58a6ff]" /> Cámaras o{" "}
          <i className="fas fa-sliders-h mx-1 text-[#58a6ff]" /> Ajustes.
        </div>
      )}

      {/* ── Camera grid ─────────────────────────────────────────────────── */}
      {!loading && visibleCameras.length > 0 && (
        <GridPanel key={gridKey} locked={!editMode}>
          {visibleCameras.map((cam, i) => (
            <div
              key={cam.id}
              className="grid-stack-item"
              gs-w="6"
              gs-h="4"
              gs-x={(i % 2) * 6}
              gs-y={Math.floor(i / 2) * 4}
            >
              <div className="grid-stack-item-content">
                <Camera
                  cameraId={cam.id}
                  name={cam.name}
                  backendUrl={BACKEND_URL}
                  strategy={MOCK_MODE ? MockStream : undefined}
                />
              </div>
            </div>
          ))}
        </GridPanel>
      )}

      {/* ── Graph overlays (flotantes, drag+resize en modo edición) ──────── */}
      {!loading &&
        Array.from(visibleGraphs).map((type) => {
          const pos = GRAPH_POSITIONS[type];
          if (!pos) return null;

          if (type === "wasdKeys") {
            return (
              <OverlayGraph
                key={type}
                initial={pos}
                editMode={editMode}
                graphType="wasdKeys"
                graphStrategy={WASDKeys}
                label="Teclas WASD"
                icon="fas fa-keyboard"
                isMock={MOCK_MODE}
              />
            );
          }
          return null;
        })}

      {/* ── Side Panel (panel lateral fijo) ─────────────────────────────── */}
      {drivingPanel && (
        <SidePanel
          controlType={controlType as "teclado" | "volante" | "mando"}
          status={status}
          isConnected={isConnected}
          hasControl={hasControl}
          canDrive={canDrive}
          speed={speed}
          controlError={controlError}
          onSpeedChange={setSpeed}
          onClaimControl={claimControl}
          onReleaseControl={releaseControl}
          onEmergencyStop={emergencyStop}
          onCycleMode={cycleMode}
          onClose={() => setDrivingPanel(false)}
        />
      )}
      </div>{/* ── cierra pt-12 ────────────────────────────────────────────────── */}
    </div>
  );
}

export default App;

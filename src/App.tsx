import { useState, useEffect, useCallback } from "react";
import GridPanel from "./components/gridPanel/GridPanel";
import Camera from "./components/Camera";
import ButtonOptions from "./components/ButtonOptions";
import { useCameras } from "./hooks/useCameras";
import { BACKEND_URL, MOCK_MODE } from "./config/backend";
import { MockStream } from "./strategies";

function App() {
  const { cameras, loading } = useCameras(BACKEND_URL);

  // ── Active (visible) cameras ──────────────────────────────────────────────
  const [activeCameras, setActiveCameras] = useState<string[]>([]);

  // Activate all cameras when the list first arrives from the backend.
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

  // ── Visible cameras only ──────────────────────────────────────────────────
  const visibleCameras = cameras.filter((c) => activeCameras.includes(c.id));

  // Stable key that changes when the camera set changes → forces GridStack
  // to remount with the new children already in the DOM.
  const gridKey = visibleCameras.map((c) => c.id).join("|");

  return (
    <div className="relative h-screen w-screen bg-[#0d1117]">
      {/* Floating toolbar — always visible */}
      <ButtonOptions
        cameras={cameras}
        activeCameras={activeCameras}
        onToggleCamera={handleToggleCamera}
      />

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex h-full w-full items-center justify-center text-[#8b949e] text-sm">
          <i className="fas fa-spinner fa-spin mr-2" />
          Detectando cámaras...
        </div>
      )}

      {/* ── Empty state (no active cameras) ── */}
      {!loading && visibleCameras.length === 0 && (
        <div className="flex h-full w-full items-center justify-center text-[#555] text-sm">
          Sin cámaras activas. Actívalas desde el menú{" "}
          <i className="fas fa-camera mx-1 text-[#58a6ff]" /> Cámaras.
        </div>
      )}

      {/* ── Grid (only mounted when children are ready) ── */}
      {!loading && visibleCameras.length > 0 && (
        <GridPanel key={gridKey}>
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
    </div>
  );
}

export default App;

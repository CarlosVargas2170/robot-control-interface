// ─── NavbarCamerasMenu ────────────────────────────────────────────────────────
// Dropdown de selección de cámaras

import type { CameraInfo } from "../../types/camera";
import { DropdownButton, DropdownCheckbox } from "./NavbarDropdown";

interface NavbarCamerasMenuProps {
  cameras: CameraInfo[];
  activeCameras: string[];
  onToggleCamera?: (cameraId: string, active: boolean) => void;
}

export function NavbarCamerasMenu({ cameras, activeCameras, onToggleCamera }: NavbarCamerasMenuProps) {
  const hasCameras = cameras.length > 0;

  return (
    <DropdownButton icon="fas fa-camera" tooltip="Cámaras" variant="cam">
      {hasCameras ? (
        cameras.map((cam) => (
          <DropdownCheckbox
            key={cam.id}
            label={cam.name}
            checked={activeCameras.includes(cam.id)}
            onChange={(v) => onToggleCamera?.(cam.id, v)}
          />
        ))
      ) : (
        <div className="px-4 py-2 text-[11px] text-[#555]">(sin cámaras detectadas)</div>
      )}
    </DropdownButton>
  );
}

// ─── NavbarSettingsMenu ───────────────────────────────────────────────────────
// Dropdown de ajustes: gráficos, controles, aplicaciones

import { useState, useCallback } from "react";
import type { GraphType } from "../../types/graph";
import {
  DropdownButton,
  DropdownCheckbox,
  DropdownRadio,
  DropdownSubmenu,
  DropdownDivider,
} from "./NavbarDropdown";

interface NavbarSettingsMenuProps {
  visibleGraphs: Set<GraphType>;
  onToggleGraph?: (type: GraphType, active: boolean) => void;
  drivingPanel: boolean;
  onToggleDrivingPanel?: (active: boolean) => void;
  controlType: string;
  onControlTypeChange?: (type: string) => void;
}

export function NavbarSettingsMenu({
  visibleGraphs,
  onToggleGraph,
  drivingPanel,
  onToggleDrivingPanel,
  controlType,
  onControlTypeChange,
}: NavbarSettingsMenuProps) {
  // Fallback local state (cuando onToggleGraph no está cableado)
  const [packetLossLocal, setPacketLoss] = useState(true);
  const [aceleracionLocal, setAceleracion] = useState(false);
  const [gpsLocal, setGps] = useState(false);
  const [lidarLocal, setLidar] = useState(false);
  const [radarFrontalLocal, setRadarFrontal] = useState(false);
  const [fusionLidarRadarLocal, setFusionLidarRadar] = useState(false);
  const [frenoManoLocal, setFrenoMano] = useState(false);
  const [wasdKeysLocal, setWasdKeys] = useState(true);
  const [controlMaster, setControlMaster] = useState(false);

  const isGraphVisible = (type: GraphType) => visibleGraphs.has(type);
  const handleGraphChange = useCallback(
    (type: GraphType) => (active: boolean) => onToggleGraph?.(type, active),
    [onToggleGraph],
  );

  const isWired = !!onToggleGraph;
  const g = (type: GraphType, local: boolean) =>
    isWired ? isGraphVisible(type) : local;
  const h = (type: GraphType, localSet: (v: boolean) => void) =>
    isWired ? handleGraphChange(type) : localSet;

  return (
    <DropdownButton icon="fas fa-sliders-h" tooltip="Ajustes">
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

      <DropdownSubmenu icon="fas fa-th-large" label="Aplicaciones">
        <DropdownCheckbox label="Mesero Robot" checked={false} onChange={() => {}} />
      </DropdownSubmenu>
    </DropdownButton>
  );
}

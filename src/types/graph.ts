// ─── Graph types ─────────────────────────────────────────────────────────────

/** Identificador único de cada gráfico overlay */
export type GraphType =
  | "accel"
  | "packetLoss"
  | "lidar"
  | "radarFront"
  | "lidarFusion"
  | "gps"
  | "steeringWheel"
  | "gamepad"
  | "wasdKeys"
  | "handbrake";

/** Registro de tecla presionada (W, A, S, D) */
export interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

/** Datos de telemetría que el backend envía por WebSocket */
export interface GraphData {
  /** Velocidad actual en km/h (0–120) */
  speed: number;
  /** Array de valores 0–1 para el gráfico de packet loss */
  packetLoss: number[];
  /** Obstáculos detectados por LiDAR (ángulo en rad, distancia normalizada 0–1) */
  lidarObstacles: Array<{ angle: number; dist: number }>;
  /** Distancias del radar frontal en cm */
  radar: { FI: number; FC: number; FD: number };
  /** Posiciones GPS (x, y en metros) + heading (radianes) */
  gps: Array<{ x: number; y: number; heading: number }>;
  /** Ángulo del volante en grados (-45 a 45) */
  steeringAngle: number;
  /** Estado del freno de mano (true = activado) */
  handbrake: boolean;
}

/** Props que recibe cualquier gráfico (Strategy Pattern) */
export interface GraphWidgetProps {
  /** Ancho disponible en píxeles */
  width: number;
  /** Alto disponible en píxeles */
  height: number;
  /** Datos de telemetría (si hay backend conectado) */
  data?: GraphData;
  /** Si debe autogenerar datos simulados */
  isMock?: boolean;
}

/** Catálogo de gráficos con su metadata */
export interface GraphMeta {
  type: GraphType;
  label: string;
  icon: string;
  /** GridStack: columnas ocupadas (12-col grid) */
  cols: number;
  /** GridStack: filas ocupadas */
  rows: number;
}

/** Catálogo completo de gráficos disponibles */
export const GRAPH_CATALOG: GraphMeta[] = [
  { type: "accel",      label: "Velocímetro",    icon: "fas fa-tachometer-alt", cols: 3, rows: 3 },
  { type: "packetLoss",  label: "Packet Loss",    icon: "fas fa-chart-line",     cols: 4, rows: 2 },
  { type: "lidar",       label: "LiDAR 2D",       icon: "fas fa-satellite",      cols: 4, rows: 4 },
  { type: "radarFront",  label: "Radar Frontal",  icon: "fas fa-broadcast-tower",cols: 4, rows: 3 },
  { type: "lidarFusion", label: "Fusión LiDAR+Radar", icon: "fas fa-layer-group",cols: 4, rows: 4 },
  { type: "gps",         label: "GPS / Navegación",icon: "fas fa-map-pin",       cols: 4, rows: 3 },
  { type: "steeringWheel",label: "Volante",        icon: "fas fa-steering-wheel", cols: 3, rows: 3 },
  { type: "gamepad",     label: "Mando Virtual",  icon: "fas fa-gamepad",        cols: 3, rows: 2 },
  { type: "wasdKeys",    label: "Teclas WASD",    icon: "fas fa-keyboard",       cols: 2, rows: 2 },
  { type: "handbrake",   label: "Freno de Mano",  icon: "fas fa-hand-paper",     cols: 2, rows: 1 },
];

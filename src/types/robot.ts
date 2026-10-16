// ─── Robot Control Types ─────────────────────────────────────────────────────
// Tipos para la comunicación con el backend Flask (app.py)

export type RobotMode = "AUTONOMO" | "TELEDIRIGIDO" | "MANDO RC" | "DESCONOCIDO";

export type UltrasonicBlock = "LIBRE" | "BLOQUEO DELANTERO" | "BLOQUEO TRASERO";

/** Estado completo del robot enviado por el backend */
export interface RobotStatus {
  serial_connected: boolean;
  serial_port: string;
  serial_error: string;
  control_taken: boolean;
  robot_mode: RobotMode;
  failsafe: boolean;
  last_command: string;
  ultrasonic_block: UltrasonicBlock;
}

/** Estado de teclas WASD */
export interface MotionKeys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

/** Payload de control enviado al backend */
export interface ControlInput {
  keys: MotionKeys;
  speed: number;
  sequence: number;
}

/** Eventos que el backend puede enviar */
export interface BackendEvents {
  status: (status: RobotStatus) => void;
  serial_log: (payload: { line: string }) => void;
  control_granted: () => void;
  control_denied: (payload: { reason: string }) => void;
  mode_denied: (payload: { reason: string }) => void;
  serial_command_denied: (payload: { reason: string }) => void;
}

/** Eventos que el frontend puede enviar */
export interface FrontendEvents {
  claim_control: () => void;
  release_control: () => void;
  control_input: (payload: ControlInput) => void;
  emergency_stop: () => void;
  cycle_mode: () => void;
  serial_command: (payload: { command: string }) => void;
  status_request: () => void;
}

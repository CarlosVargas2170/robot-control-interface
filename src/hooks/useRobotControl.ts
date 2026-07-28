// ─── useRobotControl ─────────────────────────────────────────────────────────
// Hook para manejar el control del robot (claim/release, comandos, etc.)

import { useState, useCallback, useEffect, useRef } from "react";
import { socketService } from "../services/socket";
import { MOCK_MODE } from "../config/backend";
import type { MotionKeys, RobotStatus } from "../types/robot";

export interface UseRobotControlReturn {
  /** Si este cliente tiene el control del robot */
  hasControl: boolean;
  /** Estado de las teclas WASD */
  keys: MotionKeys;
  /** Velocidad actual (0-30 RPM) */
  speed: number;
  /** Si puede conducir (tiene control + modo TELEDIRIGIDO) */
  canDrive: boolean;
  /** Mensaje de error/denegación */
  controlError: string | null;

  /** Actualiza el estado de una tecla */
  updateKey: (key: keyof MotionKeys, pressed: boolean) => void;
  /** Establece la velocidad */
  setSpeed: (speed: number) => void;
  /** Solicita tomar el control */
  claimControl: () => void;
  /** Libera el control */
  releaseControl: () => void;
  /** Envía parada de emergencia */
  emergencyStop: () => void;
  /** Cambia al siguiente modo */
  cycleMode: () => void;
  /** Envía un comando serial directo */
  sendSerialCommand: (command: string) => void;
  /** Limpia todas las teclas */
  clearKeys: () => void;
}

/**
 * Hook para controlar el robot.
 *
 * Maneja:
 * - Tomar/liberar control del robot
 * - Estado de teclas WASD
 * - Velocidad (0-30 RPM)
 * - Heartbeat de control (envía estado cada 50ms)
 * - Parada de emergencia
 * - Cambio de modo
 * - Comandos seriales directos
 */
export function useRobotControl(status: RobotStatus): UseRobotControlReturn {
  const [hasControl, setHasControl] = useState(false);
  const [keys, setKeys] = useState<MotionKeys>({
    w: false,
    a: false,
    s: false,
    d: false,
  });
  const [speed, setSpeed] = useState(20);
  const [controlError, setControlError] = useState<string | null>(null);
  const sequenceRef = useRef(0);

  // Determinar si puede conducir
  const canDrive = hasControl && status.robot_mode === "TELEDIRIGIDO";

  // ─── Listeners de control ────────────────────────────────────────────────

  useEffect(() => {
    if (MOCK_MODE) return;

    const handleControlGranted = () => {
      setHasControl(true);
      setControlError(null);
      sequenceRef.current = 0;
      // Limpiar teclas al tomar control
      setKeys({ w: false, a: false, s: false, d: false });
    };

    const handleControlDenied = (payload: { reason: string }) => {
      setHasControl(false);
      setControlError(payload.reason);
      // Limpiar el error después de 3 segundos
      setTimeout(() => setControlError(null), 3000);
    };

    socketService.on("control_granted", handleControlGranted);
    socketService.on("control_denied", handleControlDenied);

    return () => {
      socketService.off("control_granted", handleControlGranted);
      socketService.off("control_denied", handleControlDenied);
    };
  }, []);

  // ─── Heartbeat de control (50ms) ─────────────────────────────────────────

  useEffect(() => {
    if (MOCK_MODE || !hasControl) return;

    const interval = setInterval(() => {
      sequenceRef.current += 1;
      socketService.sendControlInput({
        keys,
        speed,
        sequence: sequenceRef.current,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [hasControl, keys, speed]);

  // ─── Acciones ────────────────────────────────────────────────────────────

  const updateKey = useCallback((key: keyof MotionKeys, pressed: boolean) => {
    setKeys((prev) => ({ ...prev, [key]: pressed }));
  }, []);

  const clearKeys = useCallback(() => {
    setKeys({ w: false, a: false, s: false, d: false });
  }, []);

  const claimControl = useCallback(() => {
    if (MOCK_MODE) {
      setHasControl(true);
      return;
    }
    setControlError(null);
    socketService.claimControl();
  }, []);

  const releaseControl = useCallback(() => {
    if (MOCK_MODE) {
      setHasControl(false);
      clearKeys();
      return;
    }
    clearKeys();
    socketService.releaseControl();
    setHasControl(false);
  }, [clearKeys]);

  const emergencyStop = useCallback(() => {
    clearKeys();
    if (!MOCK_MODE) {
      socketService.emergencyStop();
    }
  }, [clearKeys]);

  const cycleMode = useCallback(() => {
    clearKeys();
    if (!MOCK_MODE) {
      socketService.cycleMode();
    }
  }, [clearKeys]);

  const sendSerialCommand = useCallback((command: string) => {
    if (!MOCK_MODE && hasControl) {
      socketService.sendSerialCommand(command);
    }
  }, [hasControl]);

  // ─── Liberar control al desmontar ────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (hasControl && !MOCK_MODE) {
        socketService.releaseControl();
      }
    };
  }, [hasControl]);

  return {
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
    sendSerialCommand,
    clearKeys,
  };
}

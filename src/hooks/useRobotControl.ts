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
  /** Modo actual del robot reportado por el backend */
  currentMode: string;

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
  /** Cambia directamente a un modo específico */
  setMode: (mode: string) => void;
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
  // Refs para el heartbeat: evitan recrear el intervalo cuando cambian keys/speed
  const keysRef = useRef(keys);
  const speedRef = useRef(speed);

  // Determinar si puede conducir
  const canDrive = hasControl && status.robot_mode === "TELEDIRIGIDO";

  // Mantener refs sincronizados con el estado (sin causar re-renders)
  keysRef.current = keys;
  speedRef.current = speed;

  // ─── Listeners de control ────────────────────────────────────────────────

  useEffect(() => {
    if (MOCK_MODE) return;

    const handleControlGranted = () => {
      console.log("[useRobotControl] Control granted");
      setHasControl(true);
      setControlError(null);
      sequenceRef.current = 0;
      // Limpiar teclas al tomar control
      setKeys({ w: false, a: false, s: false, d: false });
    };

    const handleControlDenied = (payload: { reason: string }) => {
      console.log("[useRobotControl] Control denied:", payload.reason);
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
  // Usa refs para keys/speed y solo depende de hasControl.
  // Así el intervalo NO se destruye cuando cambian las teclas o la velocidad,
  // evitando gaps en el envío de heartbeats que causan falsos timeouts.
  useEffect(() => {
    if (MOCK_MODE || !hasControl) return;

    const interval = setInterval(() => {
      sequenceRef.current += 1;
      socketService.sendControlInput({
        keys: keysRef.current,
        speed: speedRef.current,
        sequence: sequenceRef.current,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [hasControl]);

  // ─── Acciones ────────────────────────────────────────────────────────────

  const updateKey = useCallback((key: keyof MotionKeys, pressed: boolean) => {
    console.log(`[useRobotControl] Key ${key}: ${pressed ? "PRESSED" : "RELEASED"}`);
    setKeys((prev) => ({ ...prev, [key]: pressed }));
  }, []);

  const clearKeys = useCallback(() => {
    console.log("[useRobotControl] Clear all keys");
    setKeys({ w: false, a: false, s: false, d: false });
  }, []);

  const claimControl = useCallback(() => {
    if (MOCK_MODE) {
      console.log("[useRobotControl] Claim control (mock)");
      setHasControl(true);
      return;
    }
    console.log("[useRobotControl] Claiming control...");
    setControlError(null);
    socketService.claimControl();
  }, []);

  const releaseControl = useCallback(() => {
    if (MOCK_MODE) {
      console.log("[useRobotControl] Release control (mock)");
      setHasControl(false);
      clearKeys();
      return;
    }
    console.log("[useRobotControl] Releasing control...");
    clearKeys();
    socketService.releaseControl();
    setHasControl(false);
  }, [clearKeys]);

  const emergencyStop = useCallback(() => {
    console.log("[useRobotControl] EMERGENCY STOP");
    clearKeys();
    if (!MOCK_MODE) {
      socketService.emergencyStop();
    }
  }, [clearKeys]);

  const cycleMode = useCallback(() => {
    console.log("[useRobotControl] Cycle mode");
    clearKeys();
    if (!MOCK_MODE) {
      socketService.cycleMode();
    }
  }, [clearKeys]);

  const setMode = useCallback((mode: string) => {
    console.log(`[useRobotControl] Set mode: ${mode}`);
    clearKeys();
    if (!MOCK_MODE) {
      socketService.setMode(mode);
    }
  }, [clearKeys]);

  const sendSerialCommand = useCallback((command: string) => {
    if (!MOCK_MODE && hasControl) {
      console.log("[useRobotControl] Send serial command:", command);
      socketService.sendSerialCommand(command);
    }
  }, [hasControl]);

  // ─── Liberar control al desmontar ────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (hasControl && !MOCK_MODE) {
        console.log("[useRobotControl] Cleanup: releasing control on unmount");
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
    currentMode: status.robot_mode,
    updateKey,
    claimControl,
    releaseControl,
    emergencyStop,
    cycleMode,
    setMode,
    sendSerialCommand,
    clearKeys,
  };
}

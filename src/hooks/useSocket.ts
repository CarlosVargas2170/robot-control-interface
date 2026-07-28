// ─── useSocket ───────────────────────────────────────────────────────────────
// Hook principal para manejar la conexión Socket.IO con el backend

import { useEffect, useState, useCallback, useRef } from "react";
import { socketService } from "../services/socket";
import { BACKEND_URL, MOCK_MODE } from "../config/backend";
import type { RobotStatus } from "../types/robot";

/** Estado mock para desarrollo sin backend */
const MOCK_STATUS: RobotStatus = {
  serial_connected: true,
  serial_port: "COM15 (mock)",
  serial_error: "",
  control_taken: false,
  robot_mode: "TELEDIRIGIDO",
  failsafe: true,
  last_command: "TELE 0 0",
  ultrasonic_block: "LIBRE",
};

export interface UseSocketReturn {
  /** Si el socket está conectado al backend */
  isConnected: boolean;
  /** Estado actual del robot */
  status: RobotStatus;
  /** Log de mensajes seriales (últimos 120) */
  serialLog: string[];
  /** Mensaje de error si la conexión falla */
  connectionError: string | null;
  /** Limpia el log serial */
  clearLog: () => void;
  /** Solicita el estado actual al backend */
  refreshStatus: () => void;
}

/**
 * Hook principal para la comunicación con el backend Flask.
 *
 * Maneja:
 * - Conexión Socket.IO (con reconexión automática)
 * - Estado del robot (status)
 * - Log serial (mensajes TX/RX)
 * - Modo mock para desarrollo sin backend
 */
export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<RobotStatus>(
    MOCK_MODE ? MOCK_STATUS : {
      serial_connected: false,
      serial_port: "",
      serial_error: "",
      control_taken: false,
      robot_mode: "DESCONOCIDO",
      failsafe: true,
      last_command: "TELE 0 0",
      ultrasonic_block: "LIBRE",
    }
  );
  const [serialLog, setSerialLog] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const logCounterRef = useRef(0);

  // ─── Conexión Socket.IO ──────────────────────────────────────────────────

  useEffect(() => {
    if (MOCK_MODE) {
      setIsConnected(true);
      return;
    }

    // Conectar al backend
    socketService.connect(BACKEND_URL);

    // Listeners de conexión
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      // Solicitar estado inicial
      socketService.requestStatus();
    };

    const handleDisconnect = (reason: string) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        setConnectionError("Desconectado por el servidor");
      }
    };

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);

    // Listener de estado del robot
    const handleStatus = (newStatus: RobotStatus) => {
      setStatus(newStatus);
    };
    socketService.on("status", handleStatus);

    // Listener de log serial
    const handleSerialLog = (payload: { line: string }) => {
      logCounterRef.current += 1;
      setSerialLog((prev) => {
        const next = [...prev, payload.line];
        // Mantener solo las últimas 120 líneas
        return next.length > 120 ? next.slice(-120) : next;
      });
    };
    socketService.on("serial_log", handleSerialLog);

    // Polling de estado cada 500ms (como el frontend original)
    const statusInterval = setInterval(() => {
      if (socketService.isConnected) {
        socketService.requestStatus();
      }
    }, 500);

    return () => {
      clearInterval(statusInterval);
      socketService.offConnect(handleConnect);
      socketService.offDisconnect(handleDisconnect);
      socketService.off("status", handleStatus);
      socketService.off("serial_log", handleSerialLog);
      socketService.disconnect();
    };
  }, []);

  const clearLog = useCallback(() => {
    setSerialLog([]);
  }, []);

  const refreshStatus = useCallback(() => {
    if (!MOCK_MODE) {
      socketService.requestStatus();
    }
  }, []);

  return {
    isConnected,
    status,
    serialLog,
    connectionError,
    clearLog,
    refreshStatus,
  };
}

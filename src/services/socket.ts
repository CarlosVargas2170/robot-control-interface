// ─── Socket Service ──────────────────────────────────────────────────────────
// Servicio singleton para manejar la conexión Socket.IO con el backend Flask

import { io, Socket } from "socket.io-client";
import type { BackendEvents, FrontendEvents, ControlInput } from "../types/robot";

class SocketService {
  private socket: Socket<BackendEvents, FrontendEvents> | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  /** Conecta al backend. Seguro llamar múltiples veces. */
  connect(url: string) {
    if (this.socket?.connected) return;

    // Desconectar socket anterior si existe
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    // Re-emitir eventos a los listeners registrados
    const events: (keyof BackendEvents)[] = [
      "status",
      "serial_log",
      "control_granted",
      "control_denied",
      "mode_denied",
      "serial_command_denied",
    ];

    for (const event of events) {
      this.socket.on(event, (...args: any[]) => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.forEach((handler) => handler(...args));
        }
      });
    }

    // Eventos de conexión
    this.socket.on("connect", () => {
      console.log("[Socket] Connected to backend");
      const handlers = this.listeners.get("connect");
      if (handlers) handlers.forEach((h) => h());
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      const handlers = this.listeners.get("disconnect");
      if (handlers) handlers.forEach((h) => h(reason));
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error.message);
    });
  }

  /** Desconecta del backend */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /** Registra un listener para un evento del backend */
  on<K extends keyof BackendEvents>(event: K, handler: BackendEvents[K]) {
    const key = event as string;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(handler);

    // Si el socket ya está conectado, registrar directamente
    if (this.socket) {
      this.socket.on(event, handler as any);
    }
  }

  /** Remueve un listener */
  off<K extends keyof BackendEvents>(event: K, handler: BackendEvents[K]) {
    const key = event as string;
    this.listeners.get(key)?.delete(handler);
    if (this.socket) {
      this.socket.off(event, handler as any);
    }
  }

  /** Registra listener para eventos de conexión */
  onConnect(handler: () => void) {
    const key = "connect";
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    if (this.socket) this.socket.on("connect", handler);
  }

  offConnect(handler: () => void) {
    this.listeners.get("connect")?.delete(handler);
    if (this.socket) this.socket.off("connect", handler);
  }

  onDisconnect(handler: (reason: string) => void) {
    const key = "disconnect";
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(handler);
    if (this.socket) this.socket.on("disconnect", handler);
  }

  offDisconnect(handler: (reason: string) => void) {
    this.listeners.get("disconnect")?.delete(handler);
    if (this.socket) this.socket.off("disconnect", handler);
  }

  // ─── Eventos de control ──────────────────────────────────────────────────

  /** Solicita tomar el control del robot */
  claimControl() {
    this.socket?.emit("claim_control");
  }

  /** Libera el control del robot */
  releaseControl() {
    this.socket?.emit("release_control");
  }

  /** Envía un input de control (teclas + velocidad) */
  sendControlInput(input: ControlInput) {
    this.socket?.emit("control_input", input);
  }

  /** Envía parada de emergencia */
  emergencyStop() {
    this.socket?.emit("emergency_stop");
  }

  /** Cambia al siguiente modo del robot */
  cycleMode() {
    this.socket?.emit("cycle_mode");
  }

  /** Envía un comando serial directo (con whitelist) */
  sendSerialCommand(command: string) {
    this.socket?.emit("serial_command", { command });
  }

  /** Solicita el estado actual del robot */
  requestStatus() {
    this.socket?.emit("status_request");
  }

  // ─── Getters ─────────────────────────────────────────────────────────────

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

/** Instancia singleton del servicio Socket */
export const socketService = new SocketService();

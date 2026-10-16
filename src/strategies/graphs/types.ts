/**
 * Strategy Pattern — Graph Widget Interface
 *
 * Cada gráfico de telemetría implementa esta interfaz.
 * Para intercambiar implementaciones, solo se cambia el componente
 * pasado al `strategy` prop de `GraphWidget`.
 *
 * @example
 * ```tsx
 * // Velocímetro con datos mock
 * <GraphWidget type="accel" strategy={AccelGraph} isMock />
 *
 * // Velocímetro con datos reales (sin cambios en el gráfico)
 * <GraphWidget type="accel" strategy={AccelGraph} data={telemetry} />
 * ```
 */
export interface GraphWidgetProps {
  /** Ancho disponible en píxeles */
  width: number;
  /** Alto disponible en píxeles */
  height: number;
  /** Datos de telemetría (si hay backend conectado) */
  data?: import("../../types/graph").GraphData;
  /** Si debe autogenerar datos simulados */
  isMock?: boolean;
}

/** Estado de teclas presionadas (extensión específica para WASD) */
export interface KeyboardState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

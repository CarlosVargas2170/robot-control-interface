/** Configuración de una tecla individual en el teclado visual */
export interface KeyConfig {
  /** Identificador único de la tecla (ej: "KeyW", "ArrowUp") */
  id: string;
  /** Etiqueta visible en la tecla (ej: "W", "↑", "␣") */
  display: string;
  /** Descripción de la acción del robot (ej: "Avanzar") */
  action: string;
  /**
   * Ancho de la tecla en "unidades de tecla" (1 = tecla normal, 2 = doble, etc.).
   * Por defecto: 1
   */
  width?: number;
  /**
   * Variante visual de la tecla.
   * - "default": tecla estándar
   * - "special": color destacado para teclas de acción especial
   * - "danger": color de advertencia (ej: parada de emergencia)
   */
  variant?: "default" | "special" | "danger";
}

/** Props del componente KeyboardChart */
export interface KeyboardChartProps {
  /** Conjunto de IDs de teclas actualmente presionadas */
  pressedKeys?: Set<string>;
  /** Callback al hacer clic en una tecla (opcional) */
  onKeyClick?: (keyId: string) => void;
  /** Si es true, todas las teclas aparecen deshabilitadas */
  disabled?: boolean;
  /** Título opcional del gráfico */
  title?: string;
}

import { type KeyboardChartProps, type KeyConfig } from "../types/keyboard";

/** Distribución de teclas relevantes para el control del robot */
const KEYBOARD_LAYOUT: KeyConfig[][] = [  
  [
    { id: "KeyW", display: "W", action: "Avanzar" ,width: 2},
    { id: "KeyA", display: "A", action: "Izquierda", width: 1 },
    { id: "KeyS", display: "S", action: "Retroceder", width: 1 },
    { id: "KeyD", display: "D", action: "Derecha", width: 1 },
  ],
];

/** Mapa de variantes a clases de Tailwind */
const VARIANT_CLASSES: Record<NonNullable<KeyConfig["variant"]>, { idle: string; pressed: string; text: string; accent: string }> = {
  default: {
    // idle: "bg-slate-700 border-slate-600 text-slate-200 shadow-slate-900/60",
    idle: "bg-transparent border-slate-600 text-white shadow-slate-900/60",
    pressed: "bg-cyan-600 border-cyan-400 text-white shadow-cyan-500/30",
    text: "text-slate-300",
    accent: "bg-cyan-500",
  },
  special: {
    idle: "bg-indigo-900/70 border-indigo-700/50 text-indigo-200 shadow-indigo-950/60",
    pressed: "bg-amber-500 border-amber-300 text-amber-950 shadow-amber-400/40",
    text: "text-indigo-300",
    accent: "bg-amber-400",
  },
  danger: {
    idle: "bg-rose-900/60 border-rose-700/50 text-rose-200 shadow-rose-950/60",
    pressed: "bg-red-600 border-red-400 text-white shadow-red-500/40",
    text: "text-rose-300",
    accent: "bg-red-500",
  },
};

/**
 * Componente que renderiza una tecla individual con su estado visual.
 */
function KeyCap({
  config,
  isPressed,
  disabled,
  onClick,
}: {
  config: KeyConfig;
  isPressed: boolean;
  disabled: boolean;
  onClick?: (keyId: string) => void;
}) {
  const variant = config.variant ?? "default";
  // const { idle, pressed, text, accent } = VARIANT_CLASSES[variant];
  const { idle, pressed } = VARIANT_CLASSES[variant];
  const width = config.width ?? 1;

  const base =
    "relative flex flex-col items-center justify-center rounded-xl border-2 font-mono transition-all duration-150 select-none cursor-pointer";

  const stateClasses = disabled
    ? "bg-slate-800/50 border-slate-700/50 text-slate-600 cursor-not-allowed"
    : isPressed
      ? `${pressed} scale-95 shadow-lg`
      : `${idle} shadow-md hover:brightness-110 active:scale-95`;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(config.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled && onClick) {
      e.preventDefault();
      onClick(config.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={isPressed}
      // aria-label={`${config.display} - ${config.action}`}
      className={`${base} ${stateClasses}`}
      style={{ flex: width }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Indicador de presión */}
      {/* {isPressed && !disabled && (
        <span
          className={`absolute -top-1.5 -right-1.5 h-10 w-10 rounded-full ${accent} animate-pulse`}
        />
      )} */}

      {/* Tecla principal */}
      <span className="text-lg font-bold leading-tight tracking-wider">
        {config.display}
      </span>
      {/* Etiqueta de acción */}
      {/* <span className={`text-[10px] leading-tight mt-0.5 ${text}`}>
        {config.action}
      </span> */}
    </div>
  );
}

/**
 * Componente que muestra un gráfico visual del teclado con las teclas
 * de control del robot, indicando cuáles están presionadas.
 */
export default function KeyboardChart({
  pressedKeys,
  onKeyClick,
  disabled = false,
  title = "Control por teclado",
}: KeyboardChartProps) {
  const isPressed = (keyId: string): boolean =>
    !disabled && (pressedKeys?.has(keyId) ?? false);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Título */}
      {title && (
        <h2 className="text-xl font-semibold tracking-wide text-slate-300 uppercase">
          {title}
        </h2>
      )}

      {/* Layout del teclado */}
      <div className="flex flex-col gap-2.5 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 shadow-xl shadow-black/20">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2.5 justify-center">
            {row.map((keyConfig) => (
              <KeyCap
                key={keyConfig.id}
                config={keyConfig}
                isPressed={isPressed(keyConfig.id)}
                disabled={disabled}
                onClick={onKeyClick}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-cyan-600 border border-cyan-400" />
          <span>Tecla presionada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-slate-700 border border-slate-600" />
          <span>Sin presionar</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
          <span>Indicador activo</span>
        </div>
      </div>
    </div>
  );
}

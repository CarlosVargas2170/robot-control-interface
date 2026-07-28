// ─── NavbarStatusPills ─────────────────────────────────────────────────────────
// Pills de estado del sistema (Web, STM32, MODE, Control)

import type { RobotStatus } from "../../types/robot";

interface NavbarStatusPillsProps {
  isConnected: boolean;
  hasControl: boolean;
  status: RobotStatus;
  /** Variante: "desktop" (horizontal) o "mobile" (vertical stack) */
  variant?: "desktop" | "mobile";
}

interface StatusStyle {
  dot: string;
  border: string;
  bg: string;
}

function statusClass(active: boolean, variant: "on" | "off" | "idle" | "warn" = "off"): StatusStyle {
  const colors: Record<string, string> = { on: "#45c982", warn: "#f4bd50", off: "#e26969", idle: "#707b80" };
  return {
    dot: colors[active ? "on" : variant],
    border: active ? "border-[#45c982]/40" : "border-[#3b4449]",
    bg: active ? "bg-[#45c982]/8" : "bg-[#202529]",
  };
}

function modeVariant(mode: string) {
  if (mode === "TELEDIRIGIDO") return "on" as const;
  if (mode === "AUTONOMO" || mode === "MANDO RC") return "warn" as const;
  return "idle" as const;
}

function modeLabel(mode: string) {
  return mode === "DESCONOCIDO" ? "MODE --" : `MODE ${mode}`;
}

function StatusPill({
  dotColor,
  borderColor,
  bg,
  children,
}: {
  dotColor: string;
  borderColor: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-[7px] min-h-[30px] px-[10px] py-[5px] border rounded text-xs font-semibold text-[#c6cdd0]"
      style={{ borderColor, background: bg }}
    >
      <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor }} />
      {children}
    </span>
  );
}

export function NavbarStatusPills({ isConnected, hasControl, status, variant = "desktop" }: NavbarStatusPillsProps) {
  const web = statusClass(isConnected, "off");
  const serial = statusClass(status.serial_connected, "off");
  const mode = statusClass(status.robot_mode !== "DESCONOCIDO", modeVariant(status.robot_mode));
  const control = statusClass(hasControl, "idle");

  const pillClass = variant === "mobile" ? "w-full" : "";

  return variant === "desktop" ? (
    <div className="hidden lg:flex items-center gap-2" aria-label="Estado del sistema">
      <StatusPill dotColor={web.dot} borderColor={web.border} bg={web.bg}>
        {isConnected ? "Web conectada" : "Web desconectada"}
      </StatusPill>
      <StatusPill dotColor={serial.dot} borderColor={serial.border} bg={serial.bg}>
        {status.serial_connected ? "STM32 conectada" : "STM32 desconectada"}
      </StatusPill>
      <StatusPill dotColor={mode.dot} borderColor={mode.border} bg={mode.bg}>
        {modeLabel(status.robot_mode)}
      </StatusPill>
      <StatusPill dotColor={control.dot} borderColor={control.border} bg={control.bg}>
        {hasControl ? "Control activo" : "Sin control"}
      </StatusPill>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <div className={pillClass}>
        <StatusPill dotColor={web.dot} borderColor={web.border} bg={web.bg}>
          {isConnected ? "Web conectada" : "Web desconectada"}
        </StatusPill>
      </div>
      <div className={pillClass}>
        <StatusPill dotColor={serial.dot} borderColor={serial.border} bg={serial.bg}>
          {status.serial_connected ? "STM32 conectada" : "STM32 desconectada"}
        </StatusPill>
      </div>
      <div className={pillClass}>
        <StatusPill dotColor={mode.dot} borderColor={mode.border} bg={mode.bg}>
          {modeLabel(status.robot_mode)}
        </StatusPill>
      </div>
      <div className={pillClass}>
        <StatusPill dotColor={control.dot} borderColor={control.border} bg={control.bg}>
          {hasControl ? "Control activo" : "Sin control"}
        </StatusPill>
      </div>
    </div>
  );
}

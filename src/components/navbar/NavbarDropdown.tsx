// ─── NavbarDropdown — primitivas de dropdown compartidas ────────────────────────

import { useId, useState, type ReactNode } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface DropdownButtonProps {
  icon: string;
  tooltip: string;
  variant?: "cam";
  onClick?: () => void;
  children?: ReactNode;
  /** Al cambiar su valor, fuerza el cierre del dropdown. Ideal para cerrar
   *  el menú cuando un checkbox interno abre un panel (ej. conducción). */
  closeToken?: number;
}

interface DropdownSubmenuProps {
  icon: string;
  label: string;
  children: ReactNode;
}

interface DropdownCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

interface DropdownLinkProps {
  label: string;
  href: string;
  icon?: string;
  target?: string;
  rel?: string;
}

interface DropdownRadioProps {
  label: string;
  value: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: string) => void;
  showConfig?: boolean;
}

// ─── DROPDOWN SUBMENU ───────────────────────────────────────────────────────

export function DropdownSubmenu({ icon, label, children }: DropdownSubmenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div>
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={open}
        className={[
          "flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-5 py-2.5 text-left",
          "text-sm text-[#c9d1d9] select-none",
          "transition-colors duration-150",
          "hover:bg-[#58a6ff]/8",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#58a6ff]",
        ].join(" ")}
        onClick={() => setOpen((prev) => !prev)}
      >
        <i className={`${icon} w-3.75 text-[#58a6ff]`} />
        <span className="flex-1">{label}</span>
        <span
          className={[
            "text-[10px] text-[#555] transition-transform duration-200",
            open && "rotate-90",
          ].join(" ")}
        >
          <i className="fas fa-chevron-right" />
        </span>
      </button>
      {open && <div id={panelId}>{children}</div>}
    </div>
  );
}

// ─── DROPDOWN BUTTON ────────────────────────────────────────────────────────

export function DropdownButton({
  icon,
  tooltip,
  variant,
  onClick,
  children,
  closeToken,
}: DropdownButtonProps) {
  const [openState, setOpenState] = useState({ open: false, closeToken });
  const hasDropdown = !!children;
  // Un token nuevo invalida el estado abierto sin provocar un render extra.
  const open = openState.closeToken === closeToken && openState.open;

  const btn = (
    <button
      title={tooltip}
      className={[
        "group relative flex h-8 w-8 items-center justify-center",
        "cursor-pointer rounded-md border-none bg-transparent text-sm",
        "text-[#c9d1d9] transition-all duration-200",
        "hover:scale-105 hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
        "active:scale-95",
        variant === "cam" && "text-[#58a6ff]",
        variant === "cam" &&
          "hover:bg-[#58a6ff]/20 hover:shadow-[0_0_20px_rgba(88,166,255,0.15)]",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        if (hasDropdown) setOpenState({ open: !open, closeToken });
        onClick?.();
      }}
    >
      <i className={icon} />
    </button>
  );

  if (!hasDropdown) return btn;

  return (
    <div className="relative">
      {btn}
      {open && (
        <div
          className={[
            "absolute right-0 z-[2000]",
            "top-[calc(100%+8px)] min-w-[300px]",
            "rounded-2xl border border-[#30363d]/30",
            "bg-[#0a0e14]/80 py-3 backdrop-blur-md",
            "shadow-[0_12px_48px_rgba(0,0,0,0.7)]",
          ].join(" ")}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── DROPDOWN CHECKBOX ──────────────────────────────────────────────────────

export function DropdownCheckbox({ label, checked, onChange }: DropdownCheckboxProps) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center gap-2.5 px-5 py-2.5",
        "text-sm text-[#c9d1d9] select-none",
        "transition-colors duration-150 hover:bg-[#58a6ff]/8",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.75 w-3.75 shrink-0 cursor-pointer accent-[#58a6ff]"
      />
      <span className="flex-1">{label}</span>
    </label>
  );
}

// ─── DROPDOWN LINK ──────────────────────────────────────────────────────────

export function DropdownLink({
  label,
  href,
  icon = "fas fa-external-link-alt",
  target,
  rel,
}: DropdownLinkProps) {
  const opensNewTab = target === "_blank";

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      aria-label={opensNewTab ? `${label} (abre en una pestaña nueva)` : label}
      className={[
        "flex cursor-pointer items-center gap-2.5 px-5 py-2.5",
        "text-sm text-[#c9d1d9] no-underline select-none",
        "transition-colors duration-150 hover:bg-[#58a6ff]/8",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#58a6ff]",
      ].join(" ")}
    >
      <i className={`${icon} h-3.75 w-3.75 shrink-0 text-[#58a6ff]`} aria-hidden="true" />
      <span className="flex-1">{label}</span>
      {opensNewTab && (
        <i
          className="fas fa-arrow-up-right-from-square text-[10px] text-[#8b949e]"
          aria-hidden="true"
        />
      )}
    </a>
  );
}

// ─── DROPDOWN RADIO ─────────────────────────────────────────────────────────

export function DropdownRadio({
  label,
  value,
  name,
  checked,
  disabled,
  onChange,
  showConfig,
}: DropdownRadioProps) {
  return (
    <label
      className={[
        "flex cursor-pointer items-center justify-between px-5 py-2.5",
        "text-sm text-[#c9d1d9] select-none",
        "transition-colors duration-150 hover:bg-[#58a6ff]/8",
      ].join(" ")}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-3.75 w-3.75 shrink-0 cursor-pointer accent-[#58a6ff]"
        />
        {label}
      </span>
      {showConfig && (
        <span className="cursor-pointer text-[#8b949e] hover:text-[#58a6ff]">⚙</span>
      )}
    </label>
  );
}

// ─── DROPDOWN DIVIDER ───────────────────────────────────────────────────────

export function DropdownDivider() {
  return <div className="mx-4 my-1 border-t border-[#30363d]/40" />;
}

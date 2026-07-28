// ─── NavbarLayoutsMenu ────────────────────────────────────────────────────────
// Dropdown de layouts: guardar y crear

import { DropdownButton } from "./NavbarDropdown";

export function NavbarLayoutsMenu() {
  return (
    <DropdownButton icon="fas fa-save" tooltip="Layouts">
      <div className="px-4 py-1 text-[11px] text-[#555]">(sin layouts guardados)</div>
      <div className="flex items-center justify-center gap-2 border-t border-[#30363d]/40 px-4 pt-3 pb-1">
        <button
          className={[
            "flex h-8.5 w-8.5 items-center justify-center",
            "cursor-pointer rounded-lg border-none bg-transparent",
            "text-sm text-[#8b949e] transition-all duration-200",
            "hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
          ].join(" ")}
          title="Guardar layout actual"
        >
          <i className="fas fa-save" />
        </button>
        <button
          className={[
            "flex h-8.5 w-8.5 items-center justify-center",
            "cursor-pointer rounded-lg border-none bg-transparent",
            "text-sm text-[#8b949e] transition-all duration-200",
            "hover:bg-[#58a6ff]/15 hover:text-[#58a6ff]",
          ].join(" ")}
          title="Crear nuevo layout"
        >
          <i className="fas fa-plus-circle" />
        </button>
      </div>
    </DropdownButton>
  );
}

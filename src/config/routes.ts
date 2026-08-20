export const MESERO_APP_ID = "mesero";

/** Indica si la URL actual corresponde a la aplicacion independiente del mesero. */
export function isMeseroControlUrl(search = window.location.search): boolean {
  return new URLSearchParams(search).get("app") === MESERO_APP_ID;
}

/**
 * Genera una URL absoluta que respeta el base path configurado en Vite.
 * Esto permite abrir el panel desde despliegues en `/` o en una subruta.
 */
export function getMeseroControlUrl(currentUrl = window.location.href): string {
  const url = new URL(import.meta.env.BASE_URL, currentUrl);
  url.searchParams.set("app", MESERO_APP_ID);
  url.hash = "";
  return url.href;
}

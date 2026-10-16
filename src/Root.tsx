import { lazy, Suspense } from "react";
import App from "./App";
import { isMeseroControlUrl } from "./config/routes";

const MeseroControlPage = lazy(
  () => import("./features/mesero-control/MeseroControlPage"),
);

export default function Root() {
  const content = isMeseroControlUrl() ? <MeseroControlPage /> : <App />;

  return (
    <Suspense
      fallback={(
        <div
          className="flex min-h-screen items-center justify-center bg-[#0d1117] text-sm text-[#8b949e]"
          role="status"
        >
          Cargando panel de Mesero Robot...
        </div>
      )}
    >
      {content}
    </Suspense>
  );
}

// src/app/hub/page.tsx - Página servidor del mundo central con escena de ciudad y acceso a secciones.
import { HubScene } from "@/components/hub/HubScene";
import { getHubRuntimeData } from "@/services/hub/get-hub-runtime-data";

export default async function HubPage() {
  const { playerLabel, hubMap } = await getHubRuntimeData();

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-3 top-3 z-[300] border border-cyan-700/55 bg-[#031120]/85 px-3 py-2 text-[11px] text-cyan-100">
        <p className="font-black uppercase tracking-[0.12em] text-cyan-200/85">Usuario activo</p>
        <p className="mt-1 font-semibold">{playerLabel}</p>
      </div>
      <HubScene progress={hubMap.progress} sections={hubMap.sections} nodes={hubMap.nodes} />
    </div>
  );
}

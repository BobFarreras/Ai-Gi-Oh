// src/app/hub/page.tsx - Entrada servidor del hub que hidrata el shell visual con progreso y secciones.
import { HubShell } from "@/components/hub/HubShell";
import { getHubRuntimeData } from "@/services/hub/get-hub-runtime-data";

export default async function HubPage() {
  const { playerLabel, hubMap } = await getHubRuntimeData();

  return (
    <HubShell playerLabel={playerLabel} progress={hubMap.progress} sections={hubMap.sections} nodes={hubMap.nodes} />
  );
}

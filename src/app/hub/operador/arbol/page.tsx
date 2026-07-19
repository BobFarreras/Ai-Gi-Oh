// src/app/hub/operador/arbol/page.tsx - Página del árbol de habilidades del Operador (ficha 8). Carga el estado
// server-side (catálogo activo + rangos + nivel/puntos derivados de la XP) y lo pasa a la constelación cliente.
import { SkillTreeScene } from "@/components/hub/progression/skill-tree/SkillTreeScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { getSkillTreeState } from "@/services/progression/get-skill-tree-state";

export default async function SkillTreePage() {
  const tree = await getSkillTreeState();
  return (
    <>
      <HubSectionEntryBurst />
      <SkillTreeScene initialTree={tree} />
    </>
  );
}

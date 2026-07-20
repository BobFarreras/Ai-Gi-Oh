// src/core/services/progression/skill-tree/skill-tree-respec-eligibility.ts - Elegibilidad de reasignación
// (ficha 8, modelo A). El jugador puede reasignar (respec) SI tiene la "llave": un nodo desbloqueado (rank >= 1)
// cuyo efecto es GRANT_RESPEC_TOKEN. Función pura, data-driven (no ata a un id de nodo). La UI la usa para
// mostrar/activar el botón; la RPC service-role vuelve a validarlo (fuente de verdad, defensa en profundidad).
import { ISkillTreeNodeView } from "./resolve-skill-tree-view";

export function canRespecSkillTree(nodes: readonly ISkillTreeNodeView[]): boolean {
  return nodes.some((view) => view.node.effect.kind === "GRANT_RESPEC_TOKEN" && view.rank >= 1);
}

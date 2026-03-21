// src/core/use-cases/tutorial/GetTutorialMapStateUseCase.ts - Orquesta catálogo y estado runtime del mapa tutorial.
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";
import { resolveTutorialMapState } from "@/core/services/tutorial/resolve-tutorial-map-state";
import { resolveTutorialNodeCatalog } from "@/core/services/tutorial/resolve-tutorial-node-catalog";

interface IGetTutorialMapStateInput {
  completedNodeIds?: string[];
}

export class GetTutorialMapStateUseCase {
  /**
   * Construye estado de mapa estable para UI sin acoplar reglas en componentes.
   */
  execute(input: IGetTutorialMapStateInput): ITutorialMapNodeRuntime[] {
    return resolveTutorialMapState({
      catalog: resolveTutorialNodeCatalog(),
      completedNodeIds: input.completedNodeIds,
    });
  }
}

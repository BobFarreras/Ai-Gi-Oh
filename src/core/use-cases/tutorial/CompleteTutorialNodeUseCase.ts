// src/core/use-cases/tutorial/CompleteTutorialNodeUseCase.ts - Marca nodos tutorial no finales como completados con validación de catálogo.
import { ValidationError } from "@/core/errors/ValidationError";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";
import { resolveTutorialNodeCatalog } from "@/core/services/tutorial/resolve-tutorial-node-catalog";

interface ICompleteTutorialNodeInput {
  playerId: string;
  nodeId: string;
}

export class CompleteTutorialNodeUseCase {
  constructor(private readonly nodeProgressRepository: ITutorialNodeProgressRepository) {}

  /**
   * Persiste completion idempotente de nodo tutorial para desbloqueo secuencial.
   */
  async execute(input: ICompleteTutorialNodeInput): Promise<{ nodeId: string }> {
    if (!input.playerId.trim() || !input.nodeId.trim()) {
      throw new ValidationError("El jugador y el nodo del tutorial son obligatorios.");
    }
    const node = resolveTutorialNodeCatalog().find((entry) => entry.id === input.nodeId);
    if (!node) throw new ValidationError("El nodo del tutorial no existe.");
    if (node.kind === "REWARD") {
      throw new ValidationError("El nodo de recompensa final se completa reclamando la recompensa.");
    }
    await this.nodeProgressRepository.markNodeCompleted(input.playerId, input.nodeId);
    return { nodeId: input.nodeId };
  }
}

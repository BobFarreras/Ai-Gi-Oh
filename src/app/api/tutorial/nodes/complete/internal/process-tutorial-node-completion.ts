// src/app/api/tutorial/nodes/complete/internal/process-tutorial-node-completion.ts - Orquesta completion idempotente de nodos tutorial desde API.
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";
import { CompleteTutorialNodeUseCase } from "@/core/use-cases/tutorial/CompleteTutorialNodeUseCase";

interface IProcessTutorialNodeCompletionInput {
  playerId: string;
  nodeId: string;
  nodeProgressRepository: ITutorialNodeProgressRepository;
}

/**
 * Marca nodo tutorial como completado para desbloqueo secuencial del mapa.
 */
export async function processTutorialNodeCompletion(input: IProcessTutorialNodeCompletionInput) {
  const useCase = new CompleteTutorialNodeUseCase(input.nodeProgressRepository);
  return useCase.execute({ playerId: input.playerId, nodeId: input.nodeId });
}

// src/core/repositories/ITutorialNodeProgressRepository.ts - Contrato de persistencia para progreso de nodos del tutorial por jugador.
export interface ITutorialNodeProgressRepository {
  listCompletedNodeIds(playerId: string): Promise<string[]>;
  markNodeCompleted(playerId: string, nodeId: string): Promise<void>;
}

// src/core/use-cases/story/GetStoryWorldStateUseCase.ts - Obtiene estado del mundo Story del jugador desde repositorios y motor de grafo.
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { buildStoryWorldGraph } from "@/core/services/story/world/build-story-world-graph";
import { IStoryWorldGraph, IStoryWorldProgressState } from "@/core/services/story/world/story-world-types";
import { buildStoryProgressState } from "@/core/use-cases/story/internal/build-story-progress-state";

interface IGetStoryWorldStateInput {
  playerId: string;
}

interface IGetStoryWorldStateOutput {
  graph: IStoryWorldGraph;
  progress: IStoryWorldProgressState;
}

export class GetStoryWorldStateUseCase {
  constructor(
    private readonly opponentRepository: IOpponentRepository,
    private readonly progressRepository: IPlayerStoryDuelProgressRepository,
  ) {}

  /**
   * Proyecta el estado navegable Story en formato de grafo + progreso del jugador.
   */
  async execute(input: IGetStoryWorldStateInput): Promise<IGetStoryWorldStateOutput> {
    const [duels, progressEntries] = await Promise.all([
      this.opponentRepository.listStoryDuels(),
      this.progressRepository.listByPlayerId(input.playerId),
    ]);
    const graph = buildStoryWorldGraph(duels);
    const completedNodeIds = progressEntries
      .filter((entry) => entry.bestResult === "WON")
      .map((entry) => entry.duelId);
    return { graph, progress: buildStoryProgressState({ graph, completedNodeIds }) };
  }
}

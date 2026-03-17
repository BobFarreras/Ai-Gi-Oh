// src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.ts - Resuelve el nodo de retorno Story tras victoria o derrota.
import { CommitStoryProgressUseCase } from "@/core/use-cases/story/CommitStoryProgressUseCase";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { ResolveStoryNodeUseCase } from "@/core/use-cases/story/ResolveStoryNodeUseCase";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { applyStoryMoveToCompactState } from "@/services/story/story-compact-state";

interface IResolveStoryDuelReturnNodeParams {
  playerId: string;
  duelNodeId: string;
  didWin: boolean;
  opponentRepository: IOpponentRepository;
  storyProgressRepository: IPlayerStoryDuelProgressRepository;
  storyWorldRepository: IPlayerStoryWorldRepository;
}

async function resolveVictoryReturnNode(params: IResolveStoryDuelReturnNodeParams): Promise<string> {
  const worldStateUseCase = new GetStoryWorldStateUseCase(params.opponentRepository, params.storyProgressRepository);
  const worldState = await worldStateUseCase.execute({ playerId: params.playerId });
  const resolveNodeUseCase = new ResolveStoryNodeUseCase();
  const resolved = resolveNodeUseCase.execute({
    graph: worldState.graph,
    progress: worldState.progress,
    nodeId: params.duelNodeId,
    nowIso: new Date().toISOString(),
  });
  const commitUseCase = new CommitStoryProgressUseCase(params.storyWorldRepository);
  await commitUseCase.execute({ playerId: params.playerId, progress: resolved.progress });
  const compactState = await params.storyWorldRepository.getCompactStateByPlayerId(params.playerId);
  const nextState = applyStoryMoveToCompactState({
    state: compactState,
    fromNodeId: compactState.currentNodeId ?? "story-ch1-player-start",
    targetNodeId: params.duelNodeId,
  });
  await params.storyWorldRepository.saveCompactStateByPlayerId(params.playerId, nextState);
  return nextState.currentNodeId ?? params.duelNodeId;
}

async function resolveDefeatReturnNode(params: IResolveStoryDuelReturnNodeParams): Promise<string> {
  const worldStateUseCase = new GetStoryWorldStateUseCase(params.opponentRepository, params.storyProgressRepository);
  const worldState = await worldStateUseCase.execute({ playerId: params.playerId });
  const node = worldState.graph.nodes.find((entry) => entry.id === params.duelNodeId);
  const fallbackNodeId = node?.unlockRequirementNodeId ?? "story-ch1-player-start";
  const compactState = await params.storyWorldRepository.getCompactStateByPlayerId(params.playerId);
  const nextState = applyStoryMoveToCompactState({
    state: compactState,
    fromNodeId: compactState.currentNodeId ?? params.duelNodeId,
    targetNodeId: fallbackNodeId,
  });
  await params.storyWorldRepository.saveCompactStateByPlayerId(params.playerId, nextState);
  return nextState.currentNodeId ?? fallbackNodeId;
}

/**
 * Resuelve de forma segura el nodo de retorno tras cerrar un duelo Story.
 */
export async function resolveStoryDuelReturnNode(params: IResolveStoryDuelReturnNodeParams): Promise<string> {
  try {
    if (params.didWin) return await resolveVictoryReturnNode(params);
    return await resolveDefeatReturnNode(params);
  } catch {
    return params.didWin ? params.duelNodeId : "story-ch1-player-start";
  }
}

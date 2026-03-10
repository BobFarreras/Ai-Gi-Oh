// src/services/story/get-story-map-runtime-data.ts - Construye el mapa Story del jugador con nodos bloqueados/desbloqueados desde repositorios.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { IStoryMapRuntimeData, IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { mergeStoryMapVisualDefinition } from "@/services/story/merge-story-map-visual-definition";
import {
  buildStoryWorldGraph,
  resolveStoryUnlockedNodeIds,
} from "@/core/services/story/world/build-story-world-graph";

export async function getStoryMapRuntimeData(): Promise<IStoryMapRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const opponentRepository = await createSupabaseOpponentRepository();
  const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const worldRepository = await createSupabasePlayerStoryWorldRepository();
  const [duels, progress] = await Promise.all([
    opponentRepository.listStoryDuels(),
    progressRepository.listByPlayerId(session.user.id),
  ]);
  const [currentNodeId, history] = await Promise.all([
    worldRepository.getCurrentNodeIdByPlayerId(session.user.id).catch(() => null),
    worldRepository.listHistoryByPlayerId(session.user.id, 20).catch(() => []),
  ]);
  const progressByDuelId = new Map(progress.map((entry) => [entry.duelId, entry]));
  const completedNodeIds = progress
    .filter((entry) => entry.bestResult === "WON")
    .map((entry) => entry.duelId);
  const worldGraph = buildStoryWorldGraph(duels);
  const unlockedNodeIds = new Set(resolveStoryUnlockedNodeIds(worldGraph, completedNodeIds));
  const runtimeNodes: IStoryMapNodeRuntime[] = worldGraph.nodes.map((node) => {
    const duelProgress = progressByDuelId.get(node.id);
    return {
      id: node.id,
      chapter: node.chapter,
      duelIndex: node.duelIndex,
      title: node.title,
      opponentName: node.opponentName,
      nodeType: node.nodeType,
      difficulty: node.difficulty,
      rewardNexus: node.rewardNexus,
      rewardPlayerExperience: node.rewardPlayerExperience,
      isBossDuel: node.nodeType === "BOSS",
      isCompleted: duelProgress?.bestResult === "WON",
      isUnlocked: unlockedNodeIds.has(node.id),
      unlockRequirementNodeId: node.unlockRequirementNodeId,
      href: node.href,
    };
  });
  return {
    playerId: session.user.id,
    nodes: mergeStoryMapVisualDefinition(runtimeNodes, history),
    currentNodeId,
    history,
  };
}

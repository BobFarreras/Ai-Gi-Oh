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

function resolveActiveChapter(input: {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  completedNodeIds: string[];
}): number {
  const currentNode = input.nodes.find((node) => node.id === input.currentNodeId);
  if (currentNode) return currentNode.chapter;
  const completedNodes = input.nodes.filter((node) => input.completedNodeIds.includes(node.id));
  if (completedNodes.length === 0) return 1;
  return Math.max(...completedNodes.map((node) => node.chapter));
}

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
  const mergedNodes = mergeStoryMapVisualDefinition(runtimeNodes, history);
  const defaultStartNodeId =
    mergedNodes.find((node) => node.id === "story-ch1-player-start")?.id ??
    mergedNodes[0]?.id ??
    null;
  const hasValidCurrentNode = Boolean(
    currentNodeId &&
      mergedNodes.some((node) => node.id === currentNodeId && node.isUnlocked),
  );
  const hasProgressSignal =
    completedNodeIds.length > 0 ||
    history.some((event) => event.kind === "MOVE" || event.kind === "INTERACTION");
  const effectiveCurrentNodeId =
    hasValidCurrentNode && hasProgressSignal ? currentNodeId : defaultStartNodeId;
  const activeChapter = resolveActiveChapter({
    nodes: mergedNodes,
    currentNodeId: effectiveCurrentNodeId,
    completedNodeIds,
  });
  const chapterNodes = mergedNodes.filter((node) => node.chapter === activeChapter);
  const chapterStartNodeId =
    chapterNodes.find((node) => node.id === `story-ch${activeChapter}-player-start`)?.id ??
    chapterNodes[0]?.id ??
    null;
  const chapterCurrentNodeId = chapterNodes.some((node) => node.id === effectiveCurrentNodeId)
    ? effectiveCurrentNodeId
    : chapterStartNodeId;
  return {
    playerId: session.user.id,
    nodes: chapterNodes,
    currentNodeId: chapterCurrentNodeId,
    history,
  };
}

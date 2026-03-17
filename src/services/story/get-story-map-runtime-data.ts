// src/services/story/get-story-map-runtime-data.ts - Construye el mapa Story del jugador con nodos bloqueados/desbloqueados desde repositorios.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/create-supabase-opponent-repository";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { IStoryMapRuntimeData, IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { mergeStoryMapVisualDefinition } from "@/services/story/merge-story-map-visual-definition";
import { resolveStoryActEntryNode } from "@/services/story/resolve-story-act-entry-node";
import { listStoryActNodeIds, resolveStoryActByNodeId } from "@/services/story/map-definitions/story-map-definition-registry";
import {
  buildStoryWorldGraph,
  resolveStoryUnlockedNodeIds,
} from "@/core/services/story/world/build-story-world-graph";

function resolveUnlockedActIds(nodes: IStoryMapNodeRuntime[]): number[] {
  return Array.from(
    new Set(
      nodes
        .filter((node) => node.isUnlocked)
        .map((node) => resolveStoryActByNodeId(node.id))
        .filter((actId): actId is number => Boolean(actId)),
    ),
  ).sort((left, right) => left - right);
}

function resolveActiveActId(input: {
  preferredActId: number | null;
  currentNodeId: string | null;
  completedNodeIds: string[];
  unlockedActIds: number[];
}): number {
  if (input.preferredActId && input.unlockedActIds.includes(input.preferredActId)) return input.preferredActId;
  const byCurrentNode = input.currentNodeId ? resolveStoryActByNodeId(input.currentNodeId) : null;
  if (byCurrentNode) return byCurrentNode;
  if (input.unlockedActIds.length > 0) return input.unlockedActIds[input.unlockedActIds.length - 1] ?? 1;
  for (const completedNodeId of input.completedNodeIds) {
    const byCompletedNode = resolveStoryActByNodeId(completedNodeId);
    if (byCompletedNode) return byCompletedNode;
  }
  return 1;
}

export async function getStoryMapRuntimeData(input?: { preferredActId?: number | null }): Promise<IStoryMapRuntimeData | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const opponentRepository = await createSupabaseOpponentRepository();
  const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const worldRepository = await createSupabasePlayerStoryWorldRepository();
  const [duels, progress] = await Promise.all([
    opponentRepository.listStoryDuels(),
    progressRepository.listByPlayerId(session.user.id),
  ]);
  const compactState = await worldRepository.getCompactStateByPlayerId(session.user.id).catch(() => ({
    currentNodeId: null,
    visitedNodeIds: [],
    interactedNodeIds: [],
  }));
  const currentNodeId = compactState.currentNodeId;
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
      opponentAvatarUrl: node.opponentAvatarUrl ?? null,
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
  const mergedNodes = mergeStoryMapVisualDefinition(
    runtimeNodes,
    {
      currentNodeId: currentNodeId ?? "story-ch1-player-start",
      visitedNodeIds: compactState.visitedNodeIds,
      interactedNodeIds: compactState.interactedNodeIds,
    },
  );
  const defaultStartNodeId =
    mergedNodes.find((node) => node.id === "story-ch1-player-start")?.id ??
    mergedNodes[0]?.id ??
    null;
  const hasValidCurrentNode = Boolean(
    currentNodeId &&
      mergedNodes.some((node) => node.id === currentNodeId && node.isUnlocked),
  );
  const latestVisitedNodeId =
    compactState.visitedNodeIds[compactState.visitedNodeIds.length - 1] ?? null;
  const hasValidVisitedCurrentNode = Boolean(
    latestVisitedNodeId &&
      mergedNodes.some((node) => node.id === latestVisitedNodeId && node.isUnlocked),
  );
  const hasProgressSignal =
    completedNodeIds.length > 0 ||
    compactState.visitedNodeIds.length > 0 ||
    compactState.interactedNodeIds.length > 0;
  const effectiveCurrentNodeId =
    hasProgressSignal
      ? hasValidCurrentNode
        ? currentNodeId
        : hasValidVisitedCurrentNode
          ? latestVisitedNodeId
          : defaultStartNodeId
      : defaultStartNodeId;
  const activeActId = resolveActiveActId({
    preferredActId: input?.preferredActId ?? null,
    currentNodeId: effectiveCurrentNodeId,
    completedNodeIds,
    unlockedActIds: resolveUnlockedActIds(mergedNodes),
  });
  const actNodeIds = new Set(listStoryActNodeIds(activeActId));
  const actNodes = mergedNodes.filter((node) => actNodeIds.has(node.id));
  const actStartNodeId =
    actNodes.find((node) => node.id === `story-ch${activeActId}-player-start`)?.id ??
    actNodes.find((node) => node.isUnlocked)?.id ??
    actNodes[0]?.id ??
    null;
  const actCurrentNodeId = resolveStoryActEntryNode({
    preferredActId: input?.preferredActId ?? null,
    activeActId,
    currentActId: effectiveCurrentNodeId ? resolveStoryActByNodeId(effectiveCurrentNodeId) : null,
    actStartNodeId,
    actNodes,
    visitedNodeIds: compactState.visitedNodeIds,
    effectiveCurrentNodeId,
  });
  return {
    playerId: session.user.id,
    nodes: actNodes,
    currentNodeId: actCurrentNodeId,
    activeActId,
    availableActIds: resolveUnlockedActIds(mergedNodes),
  };
}

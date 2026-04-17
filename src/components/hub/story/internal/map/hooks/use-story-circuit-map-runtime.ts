// src/components/hub/story/internal/map/hooks/use-story-circuit-map-runtime.ts - Calcula estado derivado del mapa Story para reducir complejidad en StoryCircuitMap.
"use client";

import { useMemo } from "react";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { buildStoryNodePositionMap, resolveStoryPathSegments, resolveStoryNodeTokenAnchor } from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { rotateStoryPositionMapForMobile, resolveStoryCanvasSize } from "@/components/hub/story/internal/map/layout/story-circuit-map-geometry";
import { resolveStoryRetreatTrail } from "@/components/hub/story/internal/map/layout/resolve-story-retreat-trail";
import { resolveStoryOpponentAvatarUrl } from "@/components/hub/story/internal/map/story-opponent-avatar";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

interface IStoryCollectVisual {
  assetSrc: string;
  assetAlt: string;
  tone: "NEXUS" | "CARD";
}

/**
 * Deriva geometría, anclas y estado visual del mapa sin mezclarlo con render e interacción.
 */
export function useStoryCircuitMapRuntime(input: {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  avatarVisualTarget: IStoryAvatarVisualTarget | null | undefined;
  collectingRewardNodeId: string | null | undefined;
  collectingRewardVisual: IStoryCollectVisual | null | undefined;
  retreatingNodeId: string | null | undefined;
  isMobileVerticalFlow: boolean;
}) {
  const basePositionMap = useMemo(() => buildStoryNodePositionMap(input.nodes), [input.nodes]);
  const positionMap = useMemo(
    () => (input.isMobileVerticalFlow ? rotateStoryPositionMapForMobile(basePositionMap) : basePositionMap),
    [basePositionMap, input.isMobileVerticalFlow],
  );
  const canvasSize = useMemo(() => resolveStoryCanvasSize(positionMap), [positionMap]);
  const segments = useMemo(() => resolveStoryPathSegments(input.nodes, positionMap), [input.nodes, positionMap]);

  const avatarTargetNodeId = input.avatarVisualTarget?.nodeId ?? input.currentNodeId;
  const avatarNode = input.nodes.find((node) => node.id === avatarTargetNodeId)
    ?? input.nodes.find((node) => node.id === input.currentNodeId)
    ?? input.nodes.find((node) => node.id === `story-ch${input.nodes[0]?.chapter ?? 1}-player-start`)
    ?? input.nodes.find((node) => node.isUnlocked)
    ?? input.nodes[0];

  const currentNodeAnchor = input.currentNodeId ? resolveStoryNodeTokenAnchor(input.currentNodeId, positionMap) : null;
  const avatarPos = avatarNode ? resolveStoryNodeTokenAnchor(avatarNode.id, positionMap) : { x: 1000, y: 1000 };
  const collectingAnchor = input.collectingRewardNodeId ? resolveStoryNodeTokenAnchor(input.collectingRewardNodeId, positionMap) : null;
  const retreatTrail = useMemo(
    () => resolveStoryRetreatTrail({ retreatingNodeId: input.retreatingNodeId ?? null, nodes: input.nodes, positionMap }),
    [input.retreatingNodeId, input.nodes, positionMap],
  );
  const retreatingNode = useMemo(
    () => (input.retreatingNodeId ? input.nodes.find((node) => node.id === input.retreatingNodeId) ?? null : null),
    [input.retreatingNodeId, input.nodes],
  );

  return {
    positionMap,
    canvasSize,
    segments,
    avatarPos,
    currentNodeAnchor,
    collectingAnchor,
    retreatTrail,
    retreatingNodeId: input.retreatingNodeId ?? null,
    retreatingAvatarUrl: resolveStoryOpponentAvatarUrl(retreatingNode),
    retreatingAvatarAlt: retreatingNode?.opponentName ? `Retirada de ${retreatingNode.opponentName}` : "Retirada de oponente",
    collectingRewardNodeId: input.collectingRewardNodeId ?? null,
    collectingRewardVisual: input.collectingRewardVisual ?? null,
  };
}


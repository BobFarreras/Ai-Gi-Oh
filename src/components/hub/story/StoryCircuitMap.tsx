// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";

import { useMemo, useRef } from "react";
import { useTransform } from "framer-motion";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { buildStoryNodePositionMap, resolveStoryPathSegments, resolveStoryNodeTokenAnchor } from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { rotateStoryPositionMapForMobile, resolveStoryCanvasSize } from "@/components/hub/story/internal/map/layout/story-circuit-map-geometry";
import { StoryMapZoomControls } from "./internal/map/components/StoryMapZoomControls";
import { StoryCircuitCanvas } from "./internal/map/components/StoryCircuitCanvas";
import { useStoryMapZoom } from "./internal/map/hooks/use-story-map-zoom";
import { useStoryCameraBounds } from "./internal/map/hooks/use-story-camera-bounds";
import { useStoryCircuitMotion } from "./internal/map/hooks/use-story-circuit-motion";
import { resolveStoryNodeSideOffsetPx } from "./internal/map/constants/story-map-geometry";
import { resolveStoryRetreatTrail } from "./internal/map/layout/resolve-story-retreat-trail";
import { resolveStoryOpponentAvatarUrl } from "./internal/map/story-opponent-avatar";

interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget?: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null;
  shouldPlayActEntryAnimation?: boolean;
  duelFocusNodeId?: string | null;
  floatingReward?: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId?: string | null;
  collectingRewardVisual?: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId?: string | null;
  isInteractionLocked?: boolean;
  isMobileVerticalFlow?: boolean;
  centerRequestKey?: number;
  onSelectNode: (nodeId: string | null) => void;
  onRewardCollectAnimationComplete?: () => void;
  onRetreatAnimationComplete?: () => void;
}

export function StoryCircuitMap({
  nodes,
  currentNodeId,
  selectedNodeId,
  avatarVisualTarget,
  shouldPlayActEntryAnimation = false,
  duelFocusNodeId,
  floatingReward,
  collectingRewardNodeId,
  collectingRewardVisual,
  retreatingNodeId,
  isInteractionLocked,
  isMobileVerticalFlow = false,
  centerRequestKey = 0,
  onSelectNode,
  onRewardCollectAnimationComplete,
  onRetreatAnimationComplete,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const basePositionMap = useMemo(() => buildStoryNodePositionMap(nodes), [nodes]);
  const positionMap = useMemo(
    () => (isMobileVerticalFlow ? rotateStoryPositionMapForMobile(basePositionMap) : basePositionMap),
    [basePositionMap, isMobileVerticalFlow],
  );
  const canvasSize = useMemo(() => resolveStoryCanvasSize(positionMap), [positionMap]);
  const { zoom, setZoom, applyWheelZoom } = useStoryMapZoom();
  const segments = useMemo(() => resolveStoryPathSegments(nodes, positionMap), [nodes, positionMap]);
  const avatarTargetNodeId = avatarVisualTarget?.nodeId ?? currentNodeId;
  const avatarNode = nodes.find((node) => node.id === avatarTargetNodeId) ?? nodes.find((node) => node.id === currentNodeId) ?? nodes.find((node) => node.id === `story-ch${nodes[0]?.chapter ?? 1}-player-start`) ?? nodes.find((node) => node.isUnlocked) ?? nodes[0];
  const currentNodeAnchor = currentNodeId ? resolveStoryNodeTokenAnchor(currentNodeId, positionMap) : null;
  const visualStance = avatarVisualTarget?.stance ?? "CENTER";
  const avatarPos = avatarNode ? resolveStoryNodeTokenAnchor(avatarNode.id, positionMap) : { x: 1000, y: 1000 };
  const avatarSideOffsetX = visualStance === "SIDE" ? -resolveStoryNodeSideOffsetPx() : 0;
  const avatarAnchorX = avatarPos.x + avatarSideOffsetX;
  const avatarAnchorY = avatarPos.y;
  const collectingAnchor = collectingRewardNodeId ? resolveStoryNodeTokenAnchor(collectingRewardNodeId, positionMap) : null;
  const retreatTrail = useMemo(
    () => resolveStoryRetreatTrail({ retreatingNodeId: retreatingNodeId ?? null, nodes, positionMap }),
    [retreatingNodeId, nodes, positionMap],
  );
  const retreatingNode = useMemo(
    () => (retreatingNodeId ? nodes.find((node) => node.id === retreatingNodeId) ?? null : null),
    [retreatingNodeId, nodes],
  );
  const retreatingAvatarUrl = resolveStoryOpponentAvatarUrl(retreatingNode);
  const retreatingAvatarAlt = retreatingNode?.opponentName ? `Retirada de ${retreatingNode.opponentName}` : "Retirada de oponente";
  const { cameraX, cameraY, cinematicScale, avatarX, avatarY, avatarScale, centerCameraOnAvatarNode, keepCameraCenterOnZoom } = useStoryCircuitMotion({
    mapContainerRef,
    avatarPos,
    avatarAnchor: { x: avatarAnchorX, y: avatarAnchorY },
    currentNodeAnchor,
    positionMap,
    duelFocusNodeId,
    centerRequestKey,
    shouldPlayActEntryAnimation,
    visualStance,
    zoom,
    setZoom,
  });
  const mapScale = useTransform(() => zoom.get() * cinematicScale.get());
  const applyCameraBounds = useStoryCameraBounds({ mapContainerRef, canvasWidth: canvasSize.width, canvasHeight: canvasSize.height, getScale: () => zoom.get() * cinematicScale.get(), cameraX, cameraY });
  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onWheel={(event) => {
        const previousZoom = zoom.get();
        const nextZoom = applyWheelZoom(event.deltaY);
        keepCameraCenterOnZoom(previousZoom, nextZoom);
        applyCameraBounds();
      }}
      onClick={() => {
        if (!isInteractionLocked) onSelectNode(null);
      }}
    >
      <StoryCircuitCanvas
        width={canvasSize.width}
        height={canvasSize.height}
        dragConstraintsRef={mapContainerRef}
        cameraX={cameraX}
        cameraY={cameraY}
        mapScale={mapScale}
        nodes={nodes}
        segments={segments}
        positionMap={positionMap}
        selectedNodeId={selectedNodeId}
        currentNodeId={currentNodeId}
        collectingRewardNodeId={collectingRewardNodeId}
        isInteractionLocked={isInteractionLocked}
        onSelectNode={onSelectNode}
        avatarX={avatarX}
        avatarY={avatarY}
        avatarScale={avatarScale}
        avatarStance={visualStance}
        avatarSideOffsetX={avatarSideOffsetX}
        collectingAnchor={collectingAnchor}
        collectingRewardVisual={collectingRewardVisual}
        onRewardCollectAnimationComplete={onRewardCollectAnimationComplete}
        floatingReward={floatingReward}
        retreatingNodeId={retreatingNodeId}
        retreatTrail={retreatTrail}
        retreatingAvatarUrl={retreatingAvatarUrl}
        retreatingAvatarAlt={retreatingAvatarAlt}
        isCameraDragEnabled={!isInteractionLocked && !duelFocusNodeId}
        onCameraDrag={applyCameraBounds}
        onRetreatAnimationComplete={onRetreatAnimationComplete}
      />
      {!isMobileVerticalFlow ? <StoryMapZoomControls onCenterPlayerNode={centerCameraOnAvatarNode} /> : null}
    </div>
  );
}

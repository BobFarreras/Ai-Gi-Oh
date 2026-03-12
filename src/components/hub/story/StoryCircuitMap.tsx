// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";

import { useEffect, useMemo, useRef } from "react";
import { animate, useMotionValue, AnimationPlaybackControls, useTransform } from "framer-motion";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import {
  buildStoryNodePositionMap,
  resolveStoryPathSegments,
  resolveStoryNodeTokenAnchor,
} from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { StoryMapZoomControls } from "./internal/map/components/StoryMapZoomControls";
import { StoryCircuitCanvas } from "./internal/map/components/StoryCircuitCanvas";
import { useStoryMapZoom } from "./internal/map/hooks/use-story-map-zoom";
import { resolveStoryNodeSideOffsetPx } from "./internal/map/constants/story-map-geometry";
import { resolveStoryRetreatTrail } from "./internal/map/layout/resolve-story-retreat-trail";

interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget?: { nodeId: string; stance: "CENTER" | "SIDE" } | null;
  duelFocusNodeId?: string | null;
  floatingReward?: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId?: string | null;
  collectingRewardVisual?: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId?: string | null;
  isInteractionLocked?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onRewardCollectAnimationComplete?: () => void;
  onRetreatAnimationComplete?: () => void;
}

const MAP_CANVAS_SIZE = { width: 3400, height: 2200 };

export function StoryCircuitMap({
  nodes,
  currentNodeId,
  selectedNodeId,
  avatarVisualTarget,
  duelFocusNodeId,
  floatingReward,
  collectingRewardNodeId,
  collectingRewardVisual,
  retreatingNodeId,
  isInteractionLocked,
  onSelectNode,
  onRewardCollectAnimationComplete,
  onRetreatAnimationComplete,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hasCenteredCamera = useRef(false);
  const avatarAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraX = useMotionValue(0); const cameraY = useMotionValue(0); const cinematicScale = useMotionValue(1);
  const avatarX = useMotionValue(1000); const avatarY = useMotionValue(1000);
  const positionMap = useMemo(() => buildStoryNodePositionMap(nodes), [nodes]);
  const { zoom, zoomIn, zoomOut, resetZoom, handleWheel } = useStoryMapZoom();
  const mapScale = useTransform(() => zoom.get() * cinematicScale.get());
  const segments = useMemo(() => resolveStoryPathSegments(nodes, positionMap), [nodes, positionMap]);
  const avatarTargetNodeId = avatarVisualTarget?.nodeId ?? currentNodeId;
  const avatarNode = nodes.find((node) => node.id === avatarTargetNodeId) ?? nodes.find((node) => node.id === "story-ch1-player-start") ?? nodes[0];
  const visualStance = avatarVisualTarget?.stance ?? "CENTER";
  const avatarPos = avatarNode ? resolveStoryNodeTokenAnchor(avatarNode.id, positionMap) : { x: 1000, y: 1000 };
  const avatarSideOffsetX = visualStance === "SIDE" ? -resolveStoryNodeSideOffsetPx() : 0;
  const collectingAnchor = collectingRewardNodeId ? resolveStoryNodeTokenAnchor(collectingRewardNodeId, positionMap) : null;
  const retreatTrail = useMemo(
    () => resolveStoryRetreatTrail({ retreatingNodeId: retreatingNodeId ?? null, nodes, positionMap }),
    [retreatingNodeId, nodes, positionMap],
  );

  useEffect(() => {
    const fromX = avatarX.get();
    const fromY = avatarY.get();
    avatarAnimRef.current.x?.stop();
    avatarAnimRef.current.y?.stop();
    const distance = Math.hypot(avatarPos.x - fromX, avatarPos.y - fromY);
    const duration = Math.min(0.7, Math.max(0.24, distance / 760));
    avatarAnimRef.current.x = animate(avatarX, avatarPos.x, { duration, ease: "easeInOut" });
    avatarAnimRef.current.y = animate(avatarY, avatarPos.y, { duration, ease: "easeInOut" });
  }, [avatarPos.x, avatarPos.y, avatarX, avatarY]);

  useEffect(() => {
    if (!duelFocusNodeId || !mapContainerRef.current) return;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const focus = resolveStoryNodeTokenAnchor(duelFocusNodeId, positionMap);
    const targetX = containerWidth / 2 - focus.x;
    const targetY = containerHeight / 2 - focus.y + 100;
    const xControls = animate(cameraX, targetX, { duration: 0.38, ease: "easeInOut" }); const yControls = animate(cameraY, targetY, { duration: 0.38, ease: "easeInOut" }); const scaleControls = animate(cinematicScale, 1.2, { duration: 0.35, ease: "easeOut" });
    return () => {
      xControls.stop();
      yControls.stop();
      scaleControls.stop();
    };
  }, [duelFocusNodeId, positionMap, cameraX, cameraY, cinematicScale]);

  useEffect(() => {
    if (hasCenteredCamera.current) return;
    if (!mapContainerRef.current) return;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const targetX = containerWidth / 2 - avatarPos.x;
    const targetY = containerHeight / 2 - avatarPos.y + 100;
    cameraX.set(targetX);
    cameraY.set(targetY);
    hasCenteredCamera.current = true;
  }, [avatarPos.x, avatarPos.y, cameraX, cameraY]);

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onWheel={handleWheel}
      onClick={() => {
        if (!isInteractionLocked) onSelectNode(null);
      }}
    >
      <StoryCircuitCanvas
        width={MAP_CANVAS_SIZE.width}
        height={MAP_CANVAS_SIZE.height}
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
        avatarSideOffsetX={avatarSideOffsetX}
        collectingAnchor={collectingAnchor}
        collectingRewardVisual={collectingRewardVisual}
        onRewardCollectAnimationComplete={onRewardCollectAnimationComplete}
        floatingReward={floatingReward}
        retreatingNodeId={retreatingNodeId}
        retreatTrail={retreatTrail}
        onRetreatAnimationComplete={onRetreatAnimationComplete}
      />
      <StoryMapZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
    </div>
  );
}

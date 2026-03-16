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
import { resolveStoryOpponentAvatarUrl } from "./internal/map/story-opponent-avatar";

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
  actSwitchLabel?: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSwitchAct?: () => void;
  onRewardCollectAnimationComplete?: () => void;
  onRetreatAnimationComplete?: () => void;
}

interface IStoryCanvasSize {
  width: number;
  height: number;
}

function resolveStoryCanvasSize(positionMap: Record<string, { x: number; y: number }>): IStoryCanvasSize {
  const points = Object.values(positionMap);
  if (points.length === 0) return { width: 4200, height: 2600 };
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  // Margen amplio para que nodos extremos y líneas nunca queden cortados.
  return {
    width: Math.max(4200, maxX + 640),
    height: Math.max(2600, maxY + 520),
  };
}

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
  actSwitchLabel = null,
  onSelectNode,
  onSwitchAct,
  onRewardCollectAnimationComplete,
  onRetreatAnimationComplete,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hasCenteredCamera = useRef(false);
  const avatarAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraX = useMotionValue(0); const cameraY = useMotionValue(0); const cinematicScale = useMotionValue(1);
  const avatarX = useMotionValue(1000); const avatarY = useMotionValue(1000);
  const positionMap = useMemo(() => buildStoryNodePositionMap(nodes), [nodes]);
  const canvasSize = useMemo(() => resolveStoryCanvasSize(positionMap), [positionMap]);
  const { zoom, setZoom, handleWheel } = useStoryMapZoom();
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
  const retreatingNode = useMemo(
    () => (retreatingNodeId ? nodes.find((node) => node.id === retreatingNodeId) ?? null : null),
    [retreatingNodeId, nodes],
  );
  const retreatingAvatarUrl = resolveStoryOpponentAvatarUrl(retreatingNode);
  const retreatingAvatarAlt = retreatingNode?.opponentName ? `Retirada de ${retreatingNode.opponentName}` : "Retirada de oponente";

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

  const centerCameraOnAvatarNode = () => {
    if (!mapContainerRef.current) return;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const targetX = containerWidth / 2 - avatarPos.x;
    const targetY = containerHeight / 2 - avatarPos.y + 100;
    animate(cameraX, targetX, { duration: 0.34, ease: "easeInOut" });
    animate(cameraY, targetY, { duration: 0.34, ease: "easeInOut" });
    animate(cinematicScale, 1, { duration: 0.28, ease: "easeOut" });
    setZoom(1);
  };

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
        avatarSideOffsetX={avatarSideOffsetX}
        collectingAnchor={collectingAnchor}
        collectingRewardVisual={collectingRewardVisual}
        onRewardCollectAnimationComplete={onRewardCollectAnimationComplete}
        floatingReward={floatingReward}
        retreatingNodeId={retreatingNodeId}
        retreatTrail={retreatTrail}
        retreatingAvatarUrl={retreatingAvatarUrl}
        retreatingAvatarAlt={retreatingAvatarAlt}
        onRetreatAnimationComplete={onRetreatAnimationComplete}
      />
      <StoryMapZoomControls onCenterPlayerNode={centerCameraOnAvatarNode} actSwitchLabel={actSwitchLabel} onSwitchAct={onSwitchAct} />
    </div>
  );
}

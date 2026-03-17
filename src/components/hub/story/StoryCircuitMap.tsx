// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
  onExitToHub?: () => void;
  onRewardCollectAnimationComplete?: () => void;
  onRetreatAnimationComplete?: () => void;
}

interface IStoryCanvasSize {
  width: number;
  height: number;
}

function rotateStoryPositionMapForMobile(positionMap: Record<string, { x: number; y: number }>): Record<string, { x: number; y: number }> {
  const points = Object.values(positionMap);
  if (points.length === 0) return positionMap;
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const transformed: Record<string, { x: number; y: number }> = {};
  for (const [nodeId, point] of Object.entries(positionMap)) {
    transformed[nodeId] = {
      x: point.y - minY + 420,
      y: maxX - point.x + 520,
    };
  }
  return transformed;
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

function resolveCameraCenterTarget(input: {
  containerWidth: number;
  containerHeight: number;
  nodePosition: { x: number; y: number };
  scale: number;
}): { x: number; y: number } {
  return {
    x: input.containerWidth / 2 - input.nodePosition.x * input.scale,
    y: input.containerHeight / 2 - input.nodePosition.y * input.scale + 100,
  };
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
  onExitToHub,
  onRewardCollectAnimationComplete,
  onRetreatAnimationComplete,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const hasCenteredCamera = useRef(false);
  const avatarAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraAnimRef = useRef<{ x: AnimationPlaybackControls | null; y: AnimationPlaybackControls | null }>({ x: null, y: null });
  const cameraX = useMotionValue(0); const cameraY = useMotionValue(0); const cinematicScale = useMotionValue(1);
  const avatarX = useMotionValue(1000); const avatarY = useMotionValue(1000); const avatarScale = useMotionValue(1);
  const basePositionMap = useMemo(() => buildStoryNodePositionMap(nodes), [nodes]);
  const positionMap = useMemo(
    () => (isMobileVerticalFlow ? rotateStoryPositionMapForMobile(basePositionMap) : basePositionMap),
    [basePositionMap, isMobileVerticalFlow],
  );
  const canvasSize = useMemo(() => resolveStoryCanvasSize(positionMap), [positionMap]);
  const { zoom, setZoom, applyWheelZoom } = useStoryMapZoom();
  const mapScale = useTransform(() => zoom.get() * cinematicScale.get());
  const segments = useMemo(() => resolveStoryPathSegments(nodes, positionMap), [nodes, positionMap]);
  const avatarTargetNodeId = avatarVisualTarget?.nodeId ?? currentNodeId;
  const avatarNode = nodes.find((node) => node.id === avatarTargetNodeId) ?? nodes.find((node) => node.id === currentNodeId) ?? nodes.find((node) => node.id === `story-ch${nodes[0]?.chapter ?? 1}-player-start`) ?? nodes.find((node) => node.isUnlocked) ?? nodes[0];
  const currentNodeAnchor = currentNodeId ? resolveStoryNodeTokenAnchor(currentNodeId, positionMap) : null;
  const visualStance = avatarVisualTarget?.stance ?? "CENTER";
  const avatarPos = avatarNode ? resolveStoryNodeTokenAnchor(avatarNode.id, positionMap) : { x: 1000, y: 1000 };
  const avatarSideOffsetX = visualStance === "SIDE" ? -resolveStoryNodeSideOffsetPx() : 0;
  const avatarAnchorX = avatarPos.x + avatarSideOffsetX;
  const avatarAnchorY = avatarPos.y;
  const hasInitializedAvatarRef = useRef(false);
  const hasPlayedActSpawnRef = useRef(false);
  const hasAppliedCenterRequestRef = useRef(0);
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

  useLayoutEffect(() => {
    if (hasInitializedAvatarRef.current) return;
    avatarX.set(avatarPos.x);
    avatarY.set(avatarPos.y);
    hasInitializedAvatarRef.current = true;
  }, [avatarPos.x, avatarPos.y, avatarX, avatarY]);

  useEffect(() => {
    if (!hasInitializedAvatarRef.current) return;
    const fromX = avatarX.get();
    const fromY = avatarY.get();
    avatarAnimRef.current.x?.stop();
    avatarAnimRef.current.y?.stop();
    const distance = Math.hypot(avatarPos.x - fromX, avatarPos.y - fromY);
    const duration = Math.min(0.7, Math.max(0.24, distance / 760));
    avatarAnimRef.current.x = animate(avatarX, avatarPos.x, { duration, ease: "easeInOut" });
    avatarAnimRef.current.y = animate(avatarY, avatarPos.y, { duration, ease: "easeInOut" });
    if (mapContainerRef.current && hasCenteredCamera.current && !duelFocusNodeId) {
      const containerWidth = mapContainerRef.current.clientWidth;
      const containerHeight = mapContainerRef.current.clientHeight;
      const target = resolveCameraCenterTarget({ containerWidth, containerHeight, nodePosition: { x: avatarAnchorX, y: avatarAnchorY }, scale: zoom.get() * cinematicScale.get() });
      cameraAnimRef.current.x?.stop();
      cameraAnimRef.current.y?.stop();
      cameraAnimRef.current.x = animate(cameraX, target.x, { duration, ease: "easeInOut" });
      cameraAnimRef.current.y = animate(cameraY, target.y, { duration, ease: "easeInOut" });
    }
  }, [avatarPos.x, avatarPos.y, avatarAnchorX, avatarAnchorY, avatarX, avatarY, cameraX, cameraY, cinematicScale, duelFocusNodeId, zoom]);

  useEffect(() => {
    const targetScale = visualStance === "PORTAL" ? 0.5 : 1;
    const controls = animate(avatarScale, targetScale, { duration: 0.22, ease: "easeInOut" });
    return () => controls.stop();
  }, [avatarScale, visualStance]);

  useEffect(() => {
    if (!shouldPlayActEntryAnimation || hasPlayedActSpawnRef.current) return;
    hasPlayedActSpawnRef.current = true;
    avatarScale.set(0.4);
    const controls = animate(avatarScale, 1, { duration: 0.34, ease: "easeOut" });
    return () => controls.stop();
  }, [avatarScale, shouldPlayActEntryAnimation]);

  useEffect(() => {
    if (!duelFocusNodeId || !mapContainerRef.current) return;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const focus = resolveStoryNodeTokenAnchor(duelFocusNodeId, positionMap);
    const target = resolveCameraCenterTarget({ containerWidth, containerHeight, nodePosition: focus, scale: zoom.get() * cinematicScale.get() });
    const xControls = animate(cameraX, target.x, { duration: 0.38, ease: "easeInOut" }); const yControls = animate(cameraY, target.y, { duration: 0.38, ease: "easeInOut" }); const scaleControls = animate(cinematicScale, 1.2, { duration: 0.35, ease: "easeOut" });
    return () => {
      xControls.stop();
      yControls.stop();
      scaleControls.stop();
    };
  }, [duelFocusNodeId, positionMap, cameraX, cameraY, cinematicScale, zoom]);

  const centerCameraOnAvatarNode = (zoomValue = zoom.get(), resetZoom = true, animated = true) => {
    if (!mapContainerRef.current) return;
    const anchor = currentNodeAnchor ?? { x: avatarAnchorX, y: avatarAnchorY };
    const effectiveZoom = resetZoom ? 1 : zoomValue;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const target = resolveCameraCenterTarget({ containerWidth, containerHeight, nodePosition: anchor, scale: effectiveZoom * cinematicScale.get() });
    cameraAnimRef.current.x?.stop();
    cameraAnimRef.current.y?.stop();
    if (animated) {
      cameraAnimRef.current.x = animate(cameraX, target.x, { duration: 0.34, ease: "easeInOut" });
      cameraAnimRef.current.y = animate(cameraY, target.y, { duration: 0.34, ease: "easeInOut" });
    } else {
      cameraX.set(target.x);
      cameraY.set(target.y);
    }
    if (resetZoom) {
      setZoom(1);
      animate(cinematicScale, 1, { duration: 0.28, ease: "easeOut" });
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!hasCenteredCamera.current) {
      centerCameraOnAvatarNode(zoom.get(), false, false);
      hasCenteredCamera.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNodeId, currentNodeAnchor?.x, currentNodeAnchor?.y]);

  useEffect(() => {
    if (!hasCenteredCamera.current) return;
    if (centerRequestKey === hasAppliedCenterRequestRef.current) return;
    hasAppliedCenterRequestRef.current = centerRequestKey;
    centerCameraOnAvatarNode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerRequestKey]);

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onWheel={(event) => {
        const nextZoom = applyWheelZoom(event.deltaY);
        centerCameraOnAvatarNode(nextZoom, false, false);
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
        onRetreatAnimationComplete={onRetreatAnimationComplete}
      />
      {!isMobileVerticalFlow ? <StoryMapZoomControls onCenterPlayerNode={centerCameraOnAvatarNode} onExitToHub={onExitToHub} /> : null}
    </div>
  );
}

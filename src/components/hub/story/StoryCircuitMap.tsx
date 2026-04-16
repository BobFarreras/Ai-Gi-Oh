// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";
import { useRef } from "react";
import { useTransform } from "framer-motion";
import { StoryMapZoomControls } from "./internal/map/components/StoryMapZoomControls";
import { StoryCircuitCanvas } from "./internal/map/components/StoryCircuitCanvas";
import { useStoryMapZoom } from "./internal/map/hooks/use-story-map-zoom";
import { useStoryCameraBounds } from "./internal/map/hooks/use-story-camera-bounds";
import { useStoryCircuitMotion } from "./internal/map/hooks/use-story-circuit-motion";
import { useStoryCircuitMapRuntime } from "./internal/map/hooks/use-story-circuit-map-runtime";
import { useStoryMapGestureControls } from "./internal/map/hooks/use-story-map-gesture-controls";
import { resolveStoryAvatarSideOffset } from "./internal/map/layout/resolve-story-avatar-side-offset";
import { StoryCircuitMapProps } from "./internal/map/types/story-circuit-map.types";

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
  isSoundtrackMuted = false,
  onToggleSoundtrackMute,
  onExitToHub,
  onSelectNode,
  onRewardCollectAnimationComplete,
  onRetreatAnimationComplete,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRuntime = useStoryCircuitMapRuntime({
    nodes,
    currentNodeId,
    avatarVisualTarget,
    collectingRewardNodeId,
    collectingRewardVisual,
    retreatingNodeId,
    isMobileVerticalFlow,
  });
  const { zoom, setZoom, applyWheelZoom, applyPinchZoom } = useStoryMapZoom();
  const visualStance = avatarVisualTarget?.stance ?? "CENTER"; const avatarSideOffset = resolveStoryAvatarSideOffset(visualStance, avatarVisualTarget?.sideDirection);
  const avatarAnchorX = mapRuntime.avatarPos.x + avatarSideOffset.x;
  const avatarAnchorY = mapRuntime.avatarPos.y + avatarSideOffset.y;
  const { cameraX, cameraY, cinematicScale, avatarX, avatarY, avatarScale, centerCameraOnAvatarNode, keepCameraCenterOnZoom } = useStoryCircuitMotion({
    mapContainerRef,
    avatarPos: mapRuntime.avatarPos,
    avatarAnchor: { x: avatarAnchorX, y: avatarAnchorY },
    currentNodeAnchor: mapRuntime.currentNodeAnchor,
    positionMap: mapRuntime.positionMap,
    duelFocusNodeId,
    centerRequestKey,
    shouldPlayActEntryAnimation,
    visualStance,
    zoom,
    setZoom,
  });
  const mapScale = useTransform(() => zoom.get() * cinematicScale.get());
  const applyCameraBounds = useStoryCameraBounds({ mapContainerRef, canvasWidth: mapRuntime.canvasSize.width, canvasHeight: mapRuntime.canvasSize.height, getScale: () => zoom.get() * cinematicScale.get(), cameraX, cameraY });
  const gestureControls = useStoryMapGestureControls({
    getZoom: zoom.get,
    applyWheelZoom,
    applyPinchZoom,
    keepCameraCenterOnZoom,
    applyCameraBounds,
  });
  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      style={isMobileVerticalFlow ? { touchAction: "none" } : undefined}
      onWheel={(event) => { gestureControls.onWheel(event.deltaY); }}
      onTouchStart={(event) => gestureControls.onTouchStart(event.touches)}
      onTouchMove={(event) => {
        if (event.touches.length === 2) event.preventDefault();
        gestureControls.onTouchMove(event.touches);
      }}
      onTouchEnd={(event) => gestureControls.onTouchEnd(event.touches)}
      onTouchCancel={gestureControls.onTouchCancel}
      onClick={() => { if (!isInteractionLocked) onSelectNode(null); }}
    >
      <StoryCircuitCanvas
        width={mapRuntime.canvasSize.width}
        height={mapRuntime.canvasSize.height}
        dragConstraintsRef={mapContainerRef}
        cameraX={cameraX}
        cameraY={cameraY}
        mapScale={mapScale}
        nodes={nodes}
        segments={mapRuntime.segments}
        positionMap={mapRuntime.positionMap}
        selectedNodeId={selectedNodeId}
        currentNodeId={currentNodeId}
        collectingRewardNodeId={mapRuntime.collectingRewardNodeId}
        isInteractionLocked={isInteractionLocked}
        onSelectNode={onSelectNode}
        avatarX={avatarX}
        avatarY={avatarY}
        avatarScale={avatarScale}
        avatarStance={visualStance}
        avatarSideOffsetX={avatarSideOffset.x}
        avatarSideOffsetY={avatarSideOffset.y}
        collectingAnchor={mapRuntime.collectingAnchor}
        collectingRewardVisual={mapRuntime.collectingRewardVisual}
        onRewardCollectAnimationComplete={onRewardCollectAnimationComplete}
        floatingReward={floatingReward}
        retreatingNodeId={mapRuntime.retreatingNodeId}
        retreatTrail={mapRuntime.retreatTrail}
        retreatingAvatarUrl={mapRuntime.retreatingAvatarUrl}
        retreatingAvatarAlt={mapRuntime.retreatingAvatarAlt}
        isCameraDragEnabled={!isInteractionLocked && !duelFocusNodeId}
        onCameraDrag={applyCameraBounds}
        onRetreatAnimationComplete={onRetreatAnimationComplete}
      />
      <StoryMapZoomControls
        onCenterPlayerNode={centerCameraOnAvatarNode}
        isSoundtrackMuted={isSoundtrackMuted}
        onToggleSoundtrackMute={onToggleSoundtrackMute ?? (() => undefined)}
        isMobileVerticalFlow={isMobileVerticalFlow}
        onExitToHub={onExitToHub}
      />
    </div>
  );
}

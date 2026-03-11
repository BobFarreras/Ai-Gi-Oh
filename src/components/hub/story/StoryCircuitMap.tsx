// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { animate, motion, useMotionValue, AnimationPlaybackControls, useTransform } from "framer-motion";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import {
  buildStoryNodePositionMap,
  resolveStoryNodePosition,
  resolveStoryPathSegments,
  resolveStoryNodeTokenAnchor,
} from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { StoryMapNode } from "./internal/map/components/StoryMapNode";
import { StoryRewardCollectEffect } from "./internal/map/components/StoryRewardCollectEffect";
import { StoryRewardFloatingText } from "./internal/map/components/StoryRewardFloatingText";
import { StoryNodeRetreatEffect } from "./internal/map/components/StoryNodeRetreatEffect";
import { StoryMapZoomControls } from "./internal/map/components/StoryMapZoomControls";
import { useStoryMapZoom } from "./internal/map/hooks/use-story-map-zoom";
import { resolveStoryNodeSideOffsetPx, STORY_NODE_TOKEN_SIZE } from "./internal/map/constants/story-map-geometry";

interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget?: { nodeId: string; stance: "CENTER" | "SIDE" } | null;
  duelFocusNodeId?: string | null;
  floatingReward?: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId?: string | null;
  retreatingNodeId?: string | null;
  isInteractionLocked?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onRewardCollectAnimationComplete?: () => void;
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
  retreatingNodeId,
  isInteractionLocked,
  onSelectNode,
  onRewardCollectAnimationComplete,
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
  const retreatingAnchor = retreatingNodeId ? resolveStoryNodeTokenAnchor(retreatingNodeId, positionMap) : null;

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
      <motion.div drag dragConstraints={mapContainerRef} dragElastic={0.1} style={{ x: cameraX, y: cameraY, scale: mapScale, width: MAP_CANVAS_SIZE.width, height: MAP_CANVAS_SIZE.height }} className="absolute left-0 top-0">
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {segments.map((segment, index) => <motion.line key={`path-${index}`} x1={segment.from.x} y1={segment.from.y} x2={segment.to.x} y2={segment.to.y} stroke="rgba(6, 182, 212, 0.26)" strokeWidth="4" strokeDasharray="12 14" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, delay: index * 0.08 }} />)}
        </svg>
        {nodes.map((node) => {
          const position = resolveStoryNodePosition(node.id, positionMap);
          return (
            <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ top: position.y, left: position.x }}>
              <StoryMapNode
                node={node}
                isSelected={selectedNodeId === node.id}
                isCurrentNode={currentNodeId === node.id}
                isCollecting={collectingRewardNodeId === node.id}
                onClick={() => { if (!isInteractionLocked) onSelectNode(node.id); }}
              />
            </div>
          );
        })}
        <motion.div className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2" initial={false} style={{ top: avatarY, left: avatarX, x: avatarSideOffsetX, width: STORY_NODE_TOKEN_SIZE, height: STORY_NODE_TOKEN_SIZE }}>
          <Image
            src="/assets/story/player/bob.png"
            alt="Avatar del jugador"
            fill
            sizes="80px"
            quality={55}
            className="rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_22px_rgba(16,185,129,0.6)]"
          />
        </motion.div>
        <StoryRewardCollectEffect isVisible={Boolean(collectingAnchor && onRewardCollectAnimationComplete)} from={collectingAnchor ?? { x: 0, y: 0 }} to={{ x: avatarX.get() + avatarSideOffsetX, y: avatarY.get() }} onComplete={() => onRewardCollectAnimationComplete?.()} />
        <StoryRewardFloatingText isVisible={Boolean(floatingReward)} label={floatingReward?.label ?? ""} tone={floatingReward?.tone} at={{ x: avatarX.get() + avatarSideOffsetX, y: avatarY.get() }} />
        <StoryNodeRetreatEffect isVisible={Boolean(retreatingAnchor)} at={retreatingAnchor ?? { x: 0, y: 0 }} />
        {isInteractionLocked ? (
          <div className="pointer-events-none absolute left-1/2 top-8 z-40 -translate-x-1/2 rounded border border-emerald-400/50 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
            Acción en curso...
          </div>
        ) : null}
      </motion.div>
      <StoryMapZoomControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetZoom} />
    </div>
  );
}

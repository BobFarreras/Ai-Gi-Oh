// src/components/hub/story/internal/map/components/StoryCircuitCanvas.tsx - Renderiza el lienzo del mapa Story con nodos, caminos y efectos visuales.
"use client";

import Image from "next/image";
import { RefObject } from "react";
import { MotionValue, motion } from "framer-motion";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { StoryMapNode } from "@/components/hub/story/internal/map/components/StoryMapNode";
import { StoryRewardCollectEffect } from "@/components/hub/story/internal/map/components/StoryRewardCollectEffect";
import { StoryRewardFloatingText } from "@/components/hub/story/internal/map/components/StoryRewardFloatingText";
import { StoryNodeRetreatEffect } from "@/components/hub/story/internal/map/components/StoryNodeRetreatEffect";
import { resolveStoryNodePosition } from "@/components/hub/story/internal/map/layout/story-circuit-layout";
import { STORY_NODE_TOKEN_SIZE } from "@/components/hub/story/internal/map/constants/story-map-geometry";

interface IPathSegmentPoint {
  x: number;
  y: number;
}

interface IStoryPathSegment {
  from: IPathSegmentPoint;
  to: IPathSegmentPoint;
}

interface IStoryCircuitCanvasProps {
  width: number;
  height: number;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
  cameraX: MotionValue<number>;
  cameraY: MotionValue<number>;
  mapScale: MotionValue<number>;
  nodes: IStoryMapNodeRuntime[];
  segments: IStoryPathSegment[];
  positionMap: Record<string, IPathSegmentPoint>;
  selectedNodeId: string | null;
  currentNodeId: string | null;
  collectingRewardNodeId?: string | null;
  isInteractionLocked?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  avatarX: MotionValue<number>;
  avatarY: MotionValue<number>;
  avatarScale: MotionValue<number>;
  avatarStance: "CENTER" | "SIDE" | "PORTAL";
  avatarSideOffsetX: number;
  collectingAnchor: IPathSegmentPoint | null;
  collectingRewardVisual?: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  onRewardCollectAnimationComplete?: () => void;
  floatingReward?: { label: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId?: string | null;
  retreatTrail: IPathSegmentPoint[];
  retreatingAvatarUrl: string;
  retreatingAvatarAlt: string;
  isCameraDragEnabled: boolean;
  onCameraDrag?: () => void;
  onRetreatAnimationComplete?: () => void;
}

/**
 * Mantiene el árbol de render del mapa aislado para simplificar StoryCircuitMap.
 */
export function StoryCircuitCanvas(props: IStoryCircuitCanvasProps) {
  return (
    <motion.div
      drag={props.isCameraDragEnabled}
      dragMomentum={false}
      dragConstraints={props.dragConstraintsRef}
      dragElastic={0.1}
      onDrag={props.onCameraDrag}
      style={{ x: props.cameraX, y: props.cameraY, scale: props.mapScale, width: props.width, height: props.height, transformOrigin: "0 0" }}
      className="absolute left-0 top-0 isolate will-change-transform"
    >
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full">
        {props.segments.map((segment, index) => (
          <motion.line
            key={`path-${index}`}
            x1={segment.from.x}
            y1={segment.from.y}
            x2={segment.to.x}
            y2={segment.to.y}
            stroke="rgba(6, 182, 212, 0.26)"
            strokeWidth="4"
            strokeDasharray="12 14"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: index * 0.08 }}
          />
        ))}
      </svg>
      {props.nodes.map((node) => {
        const position = resolveStoryNodePosition(node.id, props.positionMap);
        return (
          <div key={node.id} className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ top: position.y, left: position.x }}>
            <StoryMapNode
              node={node}
              isSelected={props.selectedNodeId === node.id}
              isCurrentNode={props.currentNodeId === node.id}
              isCollecting={props.collectingRewardNodeId === node.id}
              onClick={() => {
                if (!props.isInteractionLocked) props.onSelectNode(node.id);
              }}
            />
          </div>
        );
      })}
      <motion.div
        className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
        initial={false}
        style={{ top: props.avatarY, left: props.avatarX, x: props.avatarSideOffsetX, scale: props.avatarScale, width: STORY_NODE_TOKEN_SIZE, height: STORY_NODE_TOKEN_SIZE }}
      >
        <Image
          src="/assets/story/player/bob.png"
          alt="Avatar del jugador"
          fill
          sizes="80px"
          quality={55}
          className={props.avatarStance === "PORTAL"
            ? "rounded-full border-2 border-violet-300 object-cover shadow-[0_0_30px_rgba(168,85,247,0.85)]"
            : "rounded-full border-2 border-emerald-400 object-cover shadow-[0_0_22px_rgba(16,185,129,0.6)]"}
        />
      </motion.div>
      <StoryRewardCollectEffect
        isVisible={Boolean(props.collectingAnchor && props.collectingRewardVisual && props.onRewardCollectAnimationComplete)}
        from={props.collectingAnchor ?? { x: 0, y: 0 }}
        to={{ x: props.avatarX.get() + props.avatarSideOffsetX, y: props.avatarY.get() }}
        assetSrc={props.collectingRewardVisual?.assetSrc ?? "/assets/renders/nexus.webp"}
        assetAlt={props.collectingRewardVisual?.assetAlt ?? "Recolección"}
        tone={props.collectingRewardVisual?.tone ?? "NEXUS"}
        onComplete={() => props.onRewardCollectAnimationComplete?.()}
      />
      <StoryRewardFloatingText
        isVisible={Boolean(props.floatingReward)}
        label={props.floatingReward?.label ?? ""}
        tone={props.floatingReward?.tone}
        at={{ x: props.avatarX.get() + props.avatarSideOffsetX, y: props.avatarY.get() }}
      />
      <StoryNodeRetreatEffect
        isVisible={Boolean(props.retreatingNodeId)}
        trail={props.retreatTrail}
        avatarUrl={props.retreatingAvatarUrl}
        avatarAlt={props.retreatingAvatarAlt}
        onComplete={props.onRetreatAnimationComplete}
      />
      {props.isInteractionLocked ? (
        <div className="pointer-events-none absolute left-1/2 top-8 z-40 -translate-x-1/2 rounded border border-emerald-400/50 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
          Acción en curso...
        </div>
      ) : null}
    </motion.div>
  );
}

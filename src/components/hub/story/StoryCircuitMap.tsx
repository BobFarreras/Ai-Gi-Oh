// src/components/hub/story/StoryCircuitMap.tsx - Renderiza el mapa Story con cámara arrastrable, nodos y segmentos dinámicos.
"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import {
  buildStoryNodePositionMap,
  resolveStoryNodePosition,
  resolveStoryPathSegments,
} from "@/components/hub/story/story-circuit-layout";
import { StoryMapNode } from "./internal/StoryMapNode";

interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export function StoryCircuitMap({
  nodes,
  currentNodeId,
  selectedNodeId,
  onSelectNode,
}: StoryCircuitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const positionMap = useMemo(() => buildStoryNodePositionMap(nodes), [nodes]);
  const segments = useMemo(
    () => resolveStoryPathSegments(nodes, positionMap),
    [nodes, positionMap],
  );
  const avatarNode = nodes.find((node) => node.id === currentNodeId) ?? nodes[0];
  const avatarPos = resolveStoryNodePosition(avatarNode?.id ?? "", positionMap);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const containerWidth = mapContainerRef.current.clientWidth;
    const containerHeight = mapContainerRef.current.clientHeight;
    const targetX = containerWidth / 2 - avatarPos.x;
    const targetY = containerHeight / 2 - avatarPos.y + 100;
    animate(cameraX, targetX, { type: "spring", stiffness: 80, damping: 20, mass: 1 });
    animate(cameraY, targetY, { type: "spring", stiffness: 80, damping: 20, mass: 1 });
  }, [avatarPos.x, avatarPos.y, cameraX, cameraY]);

  return (
    <div
      ref={mapContainerRef}
      className="relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onClick={() => onSelectNode(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ transform: "rotateX(60deg) scale(2)", transformOrigin: "center" }}
      >
        <div className="h-full w-full bg-[linear-gradient(rgba(6,182,212,0.3)_2px,transparent_2px),linear-gradient(90deg,rgba(6,182,212,0.3)_2px,transparent_2px)] bg-[size:100px_100px]" />
      </div>

      <motion.div
        drag
        dragConstraints={mapContainerRef}
        dragElastic={0.1}
        style={{ x: cameraX, y: cameraY }}
        className="absolute left-0 top-0 h-[2000px] w-[2000px]"
      >
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full">
          {segments.map((segment, index) => (
            <motion.line
              key={`path-${index}`}
              x1={segment.from.x}
              y1={segment.from.y}
              x2={segment.to.x}
              y2={segment.to.y}
              stroke="rgba(6, 182, 212, 0.4)"
              strokeWidth="6"
              strokeDasharray="15 15"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, delay: index * 0.08 }}
            />
          ))}
        </svg>

        {nodes.map((node) => {
          const position = resolveStoryNodePosition(node.id, positionMap);
          return (
            <div
              key={node.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ top: position.y, left: position.x }}
            >
              <StoryMapNode
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => onSelectNode(node.id)}
              />
            </div>
          );
        })}

        <motion.div
          className="pointer-events-none absolute z-30 flex w-24 -translate-x-1/2 -translate-y-full flex-col items-center"
          initial={false}
          animate={{ top: avatarPos.y, left: avatarPos.x }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
        >
          <div className="mb-2 h-0 w-0 animate-bounce border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-emerald-400" />
          <div className="relative mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-emerald-400 bg-black shadow-[0_0_30px_#10b981]">
            <Image
              src="/assets/story/player/bob.png"
              alt="Avatar del jugador"
              fill
              sizes="56px"
              quality={55}
              className="object-cover opacity-90"
            />
          </div>
          <div className="absolute bottom-0 h-6 w-16 rounded-[50%] border-2 border-emerald-400 opacity-60 shadow-[0_0_20px_#10b981]" />
        </motion.div>
      </motion.div>
    </div>
  );
}

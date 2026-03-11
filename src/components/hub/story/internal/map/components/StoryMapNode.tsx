// src/components/hub/story/internal/map/components/StoryMapNode.tsx - Nodo interactivo del mapa Story con holograma y base visual según estado.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { StoryNodePlatform } from "./StoryNodePlatform";
import { STORY_NODE_TOKEN_SIZE } from "@/components/hub/story/internal/map/constants/story-map-geometry";

interface StoryMapNodeProps {
  node: IStoryMapNodeRuntime;
  isSelected: boolean;
  isCurrentNode?: boolean;
  onClick: () => void;
}

function resolveHologramAsset(node: IStoryMapNodeRuntime): { src: string; alt: string } | null {
  if (node.nodeType === "MOVE") return null;
  if (node.nodeType === "BOSS" || node.nodeType === "DUEL") {
    return { src: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png", alt: "Oponente" };
  }
  if (node.nodeType === "REWARD_NEXUS") return { src: "/assets/renders/nexus.png", alt: "Nexus" };
  if (node.nodeType === "REWARD_CARD") return { src: "/assets/renders/wrap.png", alt: "Carta recompensa" };
  if (node.nodeType === "EVENT") return { src: "/assets/renders/chatgpt.png", alt: "Evento" };
  return { src: "/assets/renders/react.png", alt: "Nodo de movimiento" };
}

export function StoryMapNode({ node, isSelected, isCurrentNode, onClick }: StoryMapNodeProps) {
  const hologram = resolveHologramAsset(node);
  const isDefeatedDuel = node.isCompleted && (node.nodeType === "DUEL" || node.nodeType === "BOSS");
  const isStartNode = node.id === "story-ch1-player-start";
  const isPlatformOnly = node.nodeType === "MOVE" || node.isCompleted;
  const isSelectable = node.isUnlocked || node.isCompleted;

  return (
    <motion.button
      type="button"
      aria-label={`Seleccionar nodo ${node.id}`}
      onClick={(event) => {
        event.stopPropagation();
        if (isSelectable) onClick();
      }}
      aria-disabled={!isSelectable}
      className={cn(
        "group relative flex h-40 w-32 flex-col items-center justify-end outline-none",
        isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-30 grayscale",
      )}
    >
      <motion.div
        animate={{ y: isSelected ? -15 : [0, -8, 0] }}
        transition={isSelected ? { type: "spring" } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className={cn(
          "absolute bottom-8 z-20 flex items-center justify-center transition-all duration-300",
          isPlatformOnly && "hidden",
          isSelected && "scale-125 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]",
          isCurrentNode && "scale-110 drop-shadow-[0_0_24px_rgba(16,185,129,0.85)]",
        )}
        style={{ width: STORY_NODE_TOKEN_SIZE, height: STORY_NODE_TOKEN_SIZE }}
      >
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-black/85 backdrop-blur-sm",
            node.isBossDuel ? "rotate-45 rounded-lg border-fuchsia-500" : "border-cyan-500",
            node.isCompleted && "border-emerald-500",
            isDefeatedDuel && "opacity-40 saturate-0",
            node.nodeType === "MOVE" && "border-emerald-400/60 bg-emerald-950/35",
            isCurrentNode && "border-emerald-300",
          )}
        >
          {hologram ? (
            <div className={cn("relative h-full w-full", node.isBossDuel && "-rotate-45")}>
              <Image
                src={hologram.src}
                alt={hologram.alt}
                fill
                sizes="80px"
                quality={55}
                className={cn(
                  "object-contain",
                  node.nodeType === "DUEL" || node.nodeType === "BOSS" ? "object-cover" : "p-1",
                )}
              />
            </div>
          ) : (
            <div className={cn(
              "rounded-full border border-emerald-300/60 bg-emerald-500/15",
              isStartNode ? "h-10 w-10" : "h-5 w-5",
            )} />
          )}
        </div>
      </motion.div>

      <StoryNodePlatform
        isCompleted={node.isCompleted}
        isSelected={isSelected}
        isCurrentNode={Boolean(isCurrentNode)}
      />

      {isSelected ? (
        <span className="absolute -bottom-6 z-30 whitespace-nowrap rounded-md border border-cyan-500/50 bg-black/90 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-300 shadow-xl backdrop-blur-md">
          {node.title}
        </span>
      ) : null}
    </motion.button>
  );
}

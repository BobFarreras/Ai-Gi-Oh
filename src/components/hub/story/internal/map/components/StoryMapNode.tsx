// src/components/hub/story/internal/map/components/StoryMapNode.tsx - Nodo interactivo del mapa Story con holograma y base visual según estado.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryRewardCardVisual } from "@/services/story/resolve-story-reward-card-visual";
import { resolveStoryOpponentAvatarUrl } from "@/components/hub/story/internal/map/story-opponent-avatar";
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";

interface StoryMapNodeProps {
  node: IStoryMapNodeRuntime;
  isSelected: boolean;
  isCurrentNode?: boolean;
  isCollecting?: boolean;
  onClick: () => void;
}

function resolveHologramAsset(node: IStoryMapNodeRuntime): { src: string; alt: string } | null {
  if (node.nodeType === "MOVE") return null;
  if (node.nodeType === "BOSS" || node.nodeType === "DUEL") {
    return {
      src: resolveStoryOpponentAvatarUrl(node),
      alt: node.opponentName || "Oponente",
    };
  }
  if (node.nodeType === "REWARD_NEXUS") return { src: "/assets/renders/nexus.png", alt: "Nexus" };
  if (node.nodeType === "REWARD_CARD") return resolveStoryRewardCardVisual(node.rewardCardId);
  if (node.nodeType === "EVENT") return { src: "/assets/renders/chatgpt.png", alt: "Evento" };
  return { src: "/assets/renders/react.png", alt: "Nodo de movimiento" };
}

export function StoryMapNode({ node, isSelected, isCurrentNode, isCollecting = false, onClick }: StoryMapNodeProps) {
  const hologram = resolveHologramAsset(node);
  const transitionActTarget = resolveStoryActTransitionTarget(node.id);
  const isActTransitionNode = transitionActTarget !== null;
  const isDefeatedDuel = node.isCompleted && (node.nodeType === "DUEL" || node.nodeType === "BOSS");
  const shouldShowTitle = node.nodeType === "DUEL" || node.nodeType === "BOSS";
  // Un nodo resuelto debe quedar como plataforma vacía, excepto transiciones de acto para permitir reuso.
  const shouldHideCompletedToken = node.isCompleted && node.nodeType !== "MOVE" && !isActTransitionNode;
  const shouldRenderToken = Boolean(hologram) && !isCollecting && !shouldHideCompletedToken;

  return (
    <motion.button
      type="button"
      aria-label={`Seleccionar nodo ${node.id}`}
      onClick={(event) => {
        event.stopPropagation();
        if (node.isUnlocked) onClick();
      }}
      disabled={!node.isUnlocked}
      className={cn(
        "group relative flex h-40 w-32 flex-col items-center justify-end outline-none",
        !node.isUnlocked && "cursor-not-allowed grayscale brightness-75 saturate-50",
      )}
    >
      <motion.div
        animate={{ y: isSelected ? -15 : [0, -8, 0] }}
        transition={isSelected ? { type: "spring" } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className={cn(
          "absolute bottom-8 z-20 flex h-20 w-20 items-center justify-center transition-all duration-300",
          !shouldRenderToken && "opacity-0",
          isSelected && "scale-125 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]",
          isCurrentNode && "scale-110 drop-shadow-[0_0_24px_rgba(16,185,129,0.85)]",
        )}
      >
   
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-black/85 backdrop-blur-sm",
            node.isBossDuel ? "rotate-45 rounded-lg border-fuchsia-500" : "border-cyan-500",
            isActTransitionNode && "border-violet-300/80 bg-black",
            node.isCompleted && "border-emerald-500",
            isDefeatedDuel && "opacity-40 saturate-0",
            node.nodeType === "MOVE" && "border-emerald-400/60 bg-emerald-950/35",
            isCurrentNode && "border-emerald-300",
          )}
        >
          {isActTransitionNode ? (
            <>
              <motion.div
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-1 rounded-full bg-[conic-gradient(from_0deg,rgba(168,85,247,0.0)_0deg,rgba(168,85,247,0.95)_90deg,rgba(15,23,42,0.75)_200deg,rgba(168,85,247,0.0)_360deg)]"
              />
              <div aria-hidden className="absolute inset-4 rounded-full border border-violet-200/60 bg-black shadow-[inset_0_0_22px_rgba(76,29,149,0.95)]" />
            </>
          ) : null}
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
                  isActTransitionNode && "opacity-50 blur-[0.4px]",
                  node.nodeType === "DUEL" || node.nodeType === "BOSS" ? "object-cover" : "p-1",
                )}
              />
            </div>
          ) : null}
        </div>
      </motion.div>

      <div
        className={cn(
          "absolute bottom-0 z-10 h-12 w-24 rounded-[50%] border-4 shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-colors duration-300",
          node.isCompleted
            ? "border-emerald-900 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            : isSelected
              ? "border-cyan-400 bg-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
              : "border-slate-700 bg-slate-900",
          isCurrentNode && "border-emerald-300 bg-emerald-900/70",
        )}
      >
        <div
          className={cn(
            "absolute inset-2 rounded-[50%] border-2 blur-[1px]",
            isSelected ? "animate-pulse border-cyan-300" : "border-slate-800",
          )}
        />
      </div>
      {isSelected && shouldShowTitle ? (
        <span className="absolute -bottom-6 z-30 whitespace-nowrap rounded-md border border-cyan-500/50 bg-black/90 px-3 py-1 text-[10px] font-black tracking-widest text-cyan-300 shadow-xl backdrop-blur-md">
          {node.title}
        </span>
      ) : null}
    </motion.button>
  );
}

// src/components/hub/story/internal/map/components/StoryRewardCollectEffect.tsx - Efecto visual de recolección de recompensa desde nodo hacia avatar.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface IStoryRewardCollectEffectProps {
  isVisible: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
  assetSrc: string;
  assetAlt: string;
  tone: "NEXUS" | "CARD";
  onComplete: () => void;
}

/**
 * Simula la absorción del nodo de recompensa: se reduce y viaja al avatar.
 */
export function StoryRewardCollectEffect({
  isVisible,
  from,
  to,
  assetSrc,
  assetAlt,
  tone,
  onComplete,
}: IStoryRewardCollectEffectProps) {
  if (!isVisible) return null;
  return (
    <motion.div
      className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2"
      initial={{ left: from.x, top: from.y, scale: 1, opacity: 1, rotate: 0 }}
      animate={{ left: to.x, top: to.y, scale: 0.18, opacity: 0.2, rotate: 45 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      style={{ width: 80, height: 80 }}
    >
      <Image
        src={assetSrc}
        alt={assetAlt}
        fill
        sizes="80px"
        quality={55}
        className={
          tone === "NEXUS"
            ? "object-contain drop-shadow-[0_0_16px_rgba(16,185,129,0.7)]"
            : "object-contain drop-shadow-[0_0_16px_rgba(56,189,248,0.7)]"
        }
      />
    </motion.div>
  );
}

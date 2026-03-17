// src/components/hub/story/internal/map/components/StoryNodeRetreatEffect.tsx - Anima la retirada de la ficha rival recorriendo nodos/plataformas del mapa.
"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { STORY_NODE_TOKEN_SIZE } from "@/components/hub/story/internal/map/constants/story-map-geometry";
import { IStoryCircuitPosition } from "@/components/hub/story/internal/map/layout/story-circuit-layout";

interface IStoryNodeRetreatEffectProps {
  isVisible: boolean;
  trail?: IStoryCircuitPosition[];
  avatarUrl: string;
  avatarAlt: string;
  onComplete?: () => void;
}

/**
 * Mantiene el tamaño de ficha y retrocede por la ruta del mapa hasta desaparecer en el último nodo.
 */
export function StoryNodeRetreatEffect({ isVisible, trail = [], avatarUrl, avatarAlt, onComplete }: IStoryNodeRetreatEffectProps) {
  const hasTrail = trail.length > 0;
  const duration = Math.min(2.4, Math.max(0.92, (trail.length - 1) * 0.46));
  return (
    <AnimatePresence>
      {isVisible && hasTrail ? (
        <motion.div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 1, x: trail[0]?.x ?? 0, y: trail[0]?.y ?? 0, scale: 1 }}
          animate={{
            x: trail.map((point) => point.x),
            y: trail.map((point) => point.y),
            scale: 1,
            opacity: [1, 1, 1, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: "easeInOut", opacity: { times: [0, 0.72, 0.9, 1] } }}
          onAnimationComplete={() => onComplete?.()}
          style={{ width: STORY_NODE_TOKEN_SIZE, height: STORY_NODE_TOKEN_SIZE }}
        >
          <Image
            src={avatarUrl}
            alt={avatarAlt}
            fill
            sizes="80px"
            quality={55}
            className="rounded-full border border-rose-400 object-cover shadow-[0_0_18px_rgba(244,63,94,0.55)]"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

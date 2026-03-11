// src/components/hub/story/internal/map/components/StoryNodeRetreatEffect.tsx - Efecto visual de retirada del nodo rival tras ganar un duelo.
"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { STORY_NODE_TOKEN_SIZE } from "@/components/hub/story/internal/map/constants/story-map-geometry";

interface IStoryNodeRetreatEffectProps {
  isVisible: boolean;
  at: { x: number; y: number };
}

export function StoryNodeRetreatEffect({ isVisible, at }: IStoryNodeRetreatEffectProps) {
  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0.95, x: at.x, y: at.y, scale: 1 }}
          animate={{ opacity: 0, x: at.x + 140, y: at.y - 24, scale: 0.35 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ width: STORY_NODE_TOKEN_SIZE, height: STORY_NODE_TOKEN_SIZE }}
        >
          <Image
            src="/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png"
            alt="Retirada de oponente"
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

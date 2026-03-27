// src/components/hub/onboarding/internal/OnboardingNarrationBeat.tsx - Beat narrativo reutilizable con entrada lateral del actor y aparición dinámica del buff.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface IOnboardingNarrationBeatProps {
  actorName: string;
  actorImage: string;
  actorSide: "left" | "right";
  text: string;
  actions: ReactNode;
}

/**
 * Renderiza un beat de narración con animación viva para actor y globo de diálogo.
 */
export function OnboardingNarrationBeat({ actorName, actorImage, actorSide, text, actions }: IOnboardingNarrationBeatProps) {
  const actorEnterX = actorSide === "right" ? 180 : -180;
  return (
    <div className="flex w-full max-w-[1120px] flex-col items-center">
      <motion.div
        initial={{ opacity: 0, x: actorEnterX, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 20 }}
        className="relative h-[360px] w-[360px] sm:h-[470px] sm:w-[470px]"
      >
        <Image
          src={actorImage}
          alt={actorName}
          fill
          priority
          sizes="(max-width: 640px) 360px, 470px"
          className="object-contain drop-shadow-[0_0_34px_rgba(34,211,238,0.5)]"
        />
      </motion.div>
      <motion.article
        initial={{ opacity: 0, y: -44, scale: 0.35 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 190, damping: 20, delay: 0.15 }}
        className="relative -mt-2 w-full max-w-[860px] rounded-xl border-2 border-black bg-white px-4 py-4 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] sm:px-6"
      >
        <p className="text-[11px] font-black uppercase tracking-[0.26em] text-black/70">{actorName}</p>
        <p className="mt-2 text-sm font-black leading-relaxed sm:text-base">{text}</p>
        <div className="mt-4">{actions}</div>
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l-2 border-t-2 border-black bg-white" />
      </motion.article>
    </div>
  );
}

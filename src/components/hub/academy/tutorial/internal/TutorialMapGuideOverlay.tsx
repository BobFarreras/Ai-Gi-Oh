// src/components/hub/academy/tutorial/internal/TutorialMapGuideOverlay.tsx - Overlay narrativo flotante de BigLog para guiar la primera selección en Academy.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";

interface ITutorialMapGuideOverlayProps {
  isVisible: boolean;
}

function playGuideMovementSfx(): void {
  const audio = new Audio(ONBOARDING_AUDIO_CATALOG.movement);
  audio.volume = 0.56;
  void audio.play().catch(() => undefined);
}

/**
 * Guía inicial: obliga al usuario a iniciar por Preparar Deck para arrancar el flujo tutorial.
 */
export function TutorialMapGuideOverlay({ isVisible }: ITutorialMapGuideOverlayProps) {
  useEffect(() => {
    if (!isVisible) return;
    playGuideMovementSfx();
  }, [isVisible]);

  if (!isVisible) return null;
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-3 z-[120] flex justify-center px-3 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-[min(96vw,740px)] flex-col items-center sm:max-w-[min(44vw,640px)]">
        <motion.div
          initial={{ opacity: 0, x: 160, scale: 0.88 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="relative h-[220px] w-[220px] sm:h-[300px] sm:w-[300px]"
        >
          <Image
            src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png"
            alt="BigLog Academy"
            fill
            sizes="(max-width: 640px) 220px, 300px"
            className="object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]"
          />
        </motion.div>
        <motion.article
          initial={{ opacity: 0, y: -34, scale: 0.42 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 190, damping: 20, delay: 0.12 }}
          className="relative -mt-3 w-full max-w-[620px] rounded-xl border-2 border-black bg-white px-4 py-3 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] sm:px-5 sm:py-4"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/70">BigLog</p>
          <p className="mt-2 text-sm font-black leading-relaxed sm:text-base">
            Para empezar, haz click en el nodo <span className="text-cyan-700">Preparar Deck</span>. Ahí aprenderás a montar tu mazo base.
          </p>
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l-2 border-t-2 border-black bg-white" />
        </motion.article>
      </div>
    </aside>
  );
}

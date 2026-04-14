// src/components/hub/academy/internal/AcademyPostTutorialBigLogOverlay.tsx - Overlay narrativo post-tutorial en Academy para guiar al jugador hacia Story.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";

const ACADEMY_POST_TUTORIAL_QUERY = "tutorialReward";
const ACADEMY_POST_TUTORIAL_VALUE = "core-ready";

function playSfx(path: string, volume: number): void {
  const audio = new Audio(path);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}

/**
 * Muestra un beat de BigLog al volver a Academy tras completar el tutorial y reclamar recompensa final.
 */
export function AcademyPostTutorialBigLogOverlay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isVisible = searchParams.get(ACADEMY_POST_TUTORIAL_QUERY) === ACADEMY_POST_TUTORIAL_VALUE;

  useEffect(() => {
    if (isVisible) {
      playSfx(ONBOARDING_AUDIO_CATALOG.movement, 0.56);
    }
  }, [isVisible]);

  function closeOverlay(): void {
    playSfx(ONBOARDING_AUDIO_CATALOG.buttonClick, 0.62);
    // Limpiamos query para evitar mostrar el mensaje de nuevo al refrescar Academy.
    router.replace(pathname);
  }

  if (!isVisible) return null;
  return (
    <aside className="pointer-events-none fixed inset-x-0 bottom-3 z-[140] flex justify-center px-3 sm:justify-end sm:px-6">
      <div className="flex w-full max-w-[min(96vw,760px)] flex-col items-center sm:max-w-[min(46vw,680px)]">
        <motion.div
          initial={{ opacity: 0, x: 160, scale: 0.88 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 170, damping: 20 }}
          className="relative h-[220px] w-[220px] sm:h-[320px] sm:w-[320px]"
        >
          <Image
            src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png"
            alt="BigLog post tutorial"
            fill
            priority
            sizes="(max-width: 640px) 220px, 320px"
            className="object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]"
          />
        </motion.div>
        <motion.article
          initial={{ opacity: 0, y: -34, scale: 0.42 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 190, damping: 20, delay: 0.12 }}
          className="pointer-events-auto relative -mt-3 w-full max-w-[640px] rounded-xl border-2 border-black bg-white px-4 py-3 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] sm:px-5 sm:py-4"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/70">BigLog</p>
          <p className="mt-2 text-sm font-black leading-relaxed sm:text-base">
            Ya estás preparado para entrar en el <span className="text-cyan-700">Core</span>. Ve al nodo de <span className="text-cyan-700">Story</span> y empieza a demostrar lo que sabes.
          </p>
          <button
            type="button"
            aria-label="Cerrar mensaje de BigLog"
            onClick={closeOverlay}
            className="mt-3 rounded-md border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-zinc-800"
          >
            Entendido
          </button>
          <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l-2 border-t-2 border-black bg-white" />
        </motion.article>
      </div>
    </aside>
  );
}

export const ACADEMY_POST_TUTORIAL_OVERLAY_QUERY = {
  key: ACADEMY_POST_TUTORIAL_QUERY,
  value: ACADEMY_POST_TUTORIAL_VALUE,
} as const;

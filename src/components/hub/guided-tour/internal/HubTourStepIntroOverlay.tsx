// src/components/hub/guided-tour/internal/HubTourStepIntroOverlay.tsx - Evento NPC del tour: BigLog aparece en la parte inferior con el Hub visible detrás.
"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

interface IHubTourStepIntroOverlayProps {
  isOpen: boolean;
  objective: string;
  context: string;
  onGo: () => void;
  onSkip: () => void;
}

/**
 * Overlay de evento NPC: BigLog entra desde la izquierda y habla al jugador
 * con el Hub y los nodos visibles al fondo. No cubre la escena.
 */
export function HubTourStepIntroOverlay({ isOpen, objective, context, onGo, onSkip }: IHubTourStepIntroOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.section
          key="step-intro"
          aria-label="Instrucción del tour - BigLog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="pointer-events-none fixed inset-0 z-[160]"
        >
          {/* Gradiente inferior para anclar a BigLog sin tapar los nodos */}
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#010610]/92 via-[#010610]/40 to-transparent" />

          {/* Fila inferior: BigLog + burbuja de diálogo */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 sm:gap-5 sm:px-8">
            {/* BigLog: entra DESPUÉS de que los nodos terminan de cargarse (~0.55s) */}
            <motion.div
              initial={{ x: -110, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -70, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.55 }}
              className="relative h-[210px] w-[155px] shrink-0 sm:h-[290px] sm:w-[210px]"
            >
              <Image
                src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.webp"
                alt="BigLog"
                fill
                priority
                sizes="(max-width: 640px) 155px, 210px"
                className="object-contain drop-shadow-[0_0_28px_rgba(34,211,238,0.65)]"
              />
            </motion.div>

            {/* Burbuja: entra justo después de BigLog */}
            <motion.div
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.72 }}
              className="relative mb-5 flex-1 max-w-sm rounded-xl border border-cyan-400/40 bg-[#041120]/95 px-4 py-4 shadow-[0_0_40px_rgba(34,211,238,0.22)] sm:mb-8 sm:max-w-md sm:px-5 sm:py-5"
            >
              {/* Triángulo apuntando a BigLog */}
              <span className="absolute -left-2 top-5 h-3 w-3 rotate-45 border-b border-l border-cyan-400/40 bg-[#041120]/95" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 sm:text-[11px]">BigLog</p>
              <p className="mt-1.5 text-sm font-black uppercase leading-snug text-white sm:text-base">{objective}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300 sm:text-sm">{context}</p>
              <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                <button
                  type="button"
                  onClick={onGo}
                  className="rounded-md border border-cyan-400/60 bg-cyan-950/80 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition-colors hover:bg-cyan-900/80"
                >
                  Ir
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="rounded-md border border-amber-400/60 bg-amber-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition-colors hover:bg-amber-900/80 sm:px-3 sm:py-2 sm:text-xs"
                >
                  Saltar tour
                </button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

// src/components/hub/story/internal/scene/view/StoryActTransitionOverlay.tsx - Overlay cinematográfico para transición entre actos Story.
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface IStoryActTransitionOverlayProps {
  targetActId: number | null;
}

/**
 * Muestra una breve transición visual antes de cambiar de acto.
 */
export function StoryActTransitionOverlay({ targetActId }: IStoryActTransitionOverlayProps) {
  return (
    <AnimatePresence>
      {targetActId ? (
        <motion.div
          key={`transition-act-${targetActId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-[70] overflow-hidden bg-black/90"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_65%)]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.08, opacity: 0 }}
              transition={{ duration: 0.34, ease: "easeOut" }}
              className="rounded-xl border border-cyan-400/40 bg-black/65 px-8 py-6 text-center"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300">Cambio de escenario</p>
              <p className="mt-2 text-lg font-black uppercase tracking-widest text-cyan-100">Acto {targetActId}</p>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


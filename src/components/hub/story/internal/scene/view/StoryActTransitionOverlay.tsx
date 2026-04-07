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
          className="pointer-events-none absolute inset-0 z-[70] overflow-hidden bg-[#02040bcc]"
        >
          <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeInOut" }} className="absolute inset-y-0 w-40 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,0.35),transparent)] blur-md" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15),transparent_62%)]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_bottom,rgba(56,189,248,0.2)_1px,transparent_1px)] [background-size:100%_4px]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.06, opacity: 0 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="min-w-[330px] rounded-2xl border border-cyan-300/50 bg-black/75 px-8 py-6 text-center shadow-[0_0_40px_rgba(34,211,238,0.22)]"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">Transición Story</p>
              <p className="mt-2 text-xl font-black uppercase tracking-[0.12em] text-cyan-100">Escenario Acto {targetActId}</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full border border-cyan-400/40 bg-black/90">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "0%" }} exit={{ x: "100%" }} transition={{ duration: 0.9, ease: "easeInOut" }} className="h-full w-full bg-[linear-gradient(90deg,rgba(16,185,129,0.8),rgba(34,211,238,0.95),rgba(16,185,129,0.8))]" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


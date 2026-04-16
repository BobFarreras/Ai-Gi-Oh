// src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobbyActions.tsx - Renderiza CTA de inicio y retorno para desktop y móvil.
"use client";
import { motion } from "framer-motion";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";

interface ITrainingArenaLobbyActionsProps {
  onStart: () => void;
  onBack: () => void;
}

/**
 * Centraliza acciones del lobby para mantener consistencia visual entre breakpoints.
 */
export function TrainingArenaLobbyActions({ onStart, onBack }: ITrainingArenaLobbyActionsProps) {
  return (
    <>
      <motion.div
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.42, ease: "easeOut", delay: 0.22 }}
        className="hidden flex-col items-center gap-2 md:flex"
      >
        <motion.button
          type="button"
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          animate={{ boxShadow: ["0 0 0 rgba(16,185,129,0.0)", "0 0 24px rgba(16,185,129,0.45)", "0 0 0 rgba(16,185,129,0.0)"] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="w-full max-w-md rounded-xl border border-emerald-300/70 bg-emerald-500/20 px-7 py-2.5 text-sm font-black uppercase tracking-[0.15em] text-emerald-100 hover:bg-emerald-400/30"
        >
          Empezar Combate
        </motion.button>
        <AcademyBackButton label="Volver a Academy" onClick={onBack} />
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.24 }}
        className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 md:hidden"
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
          <motion.button
            type="button"
            onClick={onStart}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl border border-emerald-300/70 bg-emerald-500/20 px-6 py-2.5 text-sm font-black uppercase tracking-[0.14em] text-emerald-100"
          >
            Empezar Combate
          </motion.button>
          <AcademyBackButton label="Volver a Academy" onClick={onBack} className="w-full" />
        </div>
      </motion.div>
    </>
  );
}

// src/components/game/board/ui/overlays/internal/TrapActivationPromptOverlay.tsx - Overlay flotante para decidir si activar o guardar una trampa reactiva.
"use client";

import { motion } from "framer-motion";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

interface TrapActivationPromptOverlayProps {
  prompt: ITrapActivationPrompt;
  onActivate: () => void;
  onSkip: () => void;
}

function resolveTriggerLabel(trigger: ITrapActivationPrompt["trigger"]): string {
  if (trigger === "ON_OPPONENT_ATTACK_DECLARED") return "Ataque rival";
  if (trigger === "ON_OPPONENT_EXECUTION_ACTIVATED") return "Ejecución rival";
  return "Trampa rival";
}

export function TrapActivationPromptOverlay({ prompt, onActivate, onSkip }: TrapActivationPromptOverlayProps) {
  return (
    <motion.div
      initial={{ x: -460, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -460, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="absolute left-4 top-24 z-[170] w-[min(92vw,34rem)] rounded-2xl border border-fuchsia-300/70 bg-fuchsia-950/92 px-5 py-4 text-fuchsia-100 shadow-[0_0_45px_rgba(217,70,239,0.35)]"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-300">Trampa Reactiva</p>
      <p className="mt-1 text-sm font-semibold text-fuchsia-100">
        {resolveTriggerLabel(prompt.trigger)} · <span className="font-black">{prompt.trapCard.name}</span>
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Activar trampa ahora"
          onClick={onActivate}
          className="rounded-lg border border-fuchsia-200/70 bg-fuchsia-500/35 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-50 hover:bg-fuchsia-500/45"
        >
          Activar
        </button>
        <button
          type="button"
          aria-label="Cancelar activación de trampa"
          onClick={onSkip}
          className="rounded-lg border border-zinc-400/60 bg-zinc-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-100 hover:border-zinc-200"
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  );
}

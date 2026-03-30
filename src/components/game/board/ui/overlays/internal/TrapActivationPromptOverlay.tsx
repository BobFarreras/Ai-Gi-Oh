// src/components/game/board/ui/overlays/internal/TrapActivationPromptOverlay.tsx - Overlay flotante para decidir si activar o guardar una trampa reactiva.
"use client";

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
    <div className="absolute left-1/2 top-[22%] z-[170] w-[92%] max-w-xl -translate-x-1/2 rounded-2xl border border-fuchsia-300/70 bg-fuchsia-950/92 px-5 py-4 text-fuchsia-100 shadow-[0_0_45px_rgba(217,70,239,0.35)]">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">Respuesta de trampa</p>
      <p className="mt-1 text-sm font-semibold text-fuchsia-100">
        {resolveTriggerLabel(prompt.trigger)}: <span className="font-black">{prompt.trapCard.name}</span>
      </p>
      <p className="mt-1 text-xs text-fuchsia-200/90">¿Quieres activar esta trampa ahora o guardarla para otra reacción?</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label="Guardar trampa para más tarde"
          onClick={onSkip}
          className="rounded-lg border border-zinc-400/60 bg-zinc-900/75 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-100 hover:border-zinc-200"
        >
          Guardar
        </button>
        <button
          type="button"
          aria-label="Activar trampa ahora"
          onClick={onActivate}
          className="rounded-lg border border-fuchsia-200/70 bg-fuchsia-500/35 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-50 hover:bg-fuchsia-500/45"
        >
          Activar
        </button>
      </div>
    </div>
  );
}

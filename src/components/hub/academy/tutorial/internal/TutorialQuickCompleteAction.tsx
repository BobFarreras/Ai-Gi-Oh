// src/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction.tsx - Acción manual para completar onboarding tutorial desde el mapa cuando el jugador decide saltarlo.
"use client";

import { useState } from "react";
import { postTutorialCombatRewardClaim, postTutorialNodeCompletion, postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { markTutorialSoundtrackFirstRunFinished } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

interface ITutorialQuickCompleteActionProps {
  isAlreadyCompleted: boolean;
}

const TUTORIAL_NODE_IDS_TO_COMPLETE = ["tutorial-arsenal-basics", "tutorial-market-basics", "tutorial-combat-basics"] as const;

/**
 * Permite desbloquear Hub de forma explícita para jugadores que ya conocen el tutorial.
 */
export function TutorialQuickCompleteAction({ isAlreadyCompleted }: ITutorialQuickCompleteActionProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isHidden, setIsHidden] = useState(isAlreadyCompleted);
  const [status, setStatus] = useState<string | null>(null);

  async function handleQuickComplete(): Promise<void> {
    setIsApplying(true);
    setStatus("Aplicando completado rápido del tutorial...");
    try {
      await Promise.all(TUTORIAL_NODE_IDS_TO_COMPLETE.map((nodeId) => postTutorialNodeCompletion(nodeId)));
      await postTutorialCombatRewardClaim().catch(() => ({ applied: false, rewardCardId: "" }));
      await postTutorialRewardClaim();
      markTutorialSoundtrackFirstRunFinished();
      setStatus("Tutorial marcado como completado con recompensa aplicada.");
      setIsHidden(true);
    } catch {
      setStatus("No se pudo completar el tutorial ahora. Vuelve a intentarlo.");
    } finally {
      setIsApplying(false);
    }
  }

  if (isHidden) return status ? <p className="text-center text-[11px] font-black uppercase tracking-[0.11em] text-emerald-300">{status}</p> : null;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => void handleQuickComplete()}
        disabled={isApplying}
        className="rounded-md border border-emerald-300/60 bg-emerald-600/20 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-45"
      >
        {isApplying ? "Aplicando..." : "Completar tutorial + recompensa"}
      </button>
      {status ? <p className="text-center text-[11px] font-black uppercase tracking-[0.11em] text-emerald-300">{status}</p> : null}
    </div>
  );
}

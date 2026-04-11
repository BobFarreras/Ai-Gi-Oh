// src/components/hub/academy/tutorial/internal/TutorialQuickCompleteAction.tsx - Acción manual para completar onboarding tutorial desde el mapa cuando el jugador decide saltarlo.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { postTutorialCombatRewardClaim, postTutorialNodeCompletion, postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { markTutorialSoundtrackFirstRunFinished } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";
import { CombatTutorialRewardOverlay } from "@/components/hub/academy/training/modes/tutorial/CombatTutorialRewardOverlay";
import { TUTORIAL_QUICK_COMPLETE_OPENED_EVENT } from "@/components/hub/academy/tutorial/internal/tutorial-quick-complete-events";

interface ITutorialQuickCompleteActionProps {
  isAlreadyCompleted: boolean;
  onOpenQuickComplete?: () => void;
}

const TUTORIAL_NODE_IDS_TO_COMPLETE = ["tutorial-arsenal-basics", "tutorial-market-basics", "tutorial-combat-basics"] as const;
const QUICK_COMPLETE_CLAIM_MAX_ATTEMPTS = 3;

function waitMilliseconds(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
}

/**
 * Permite desbloquear Hub de forma explícita para jugadores que ya conocen el tutorial.
 */
export function TutorialQuickCompleteAction({ isAlreadyCompleted, onOpenQuickComplete }: ITutorialQuickCompleteActionProps) {
  const router = useRouter();
  const rewardCard = useMemo(() => EXECUTION_CARDS.find((card) => card.id === "exec-fusion-gemgpt") ?? EXECUTION_CARDS[0], []);
  const rewardNexus = 600;
  const [isApplying, setIsApplying] = useState(false);
  const [isHidden, setIsHidden] = useState(isAlreadyCompleted);
  const [isRewardOverlayVisible, setIsRewardOverlayVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isRewardOverlayVisible) return;
    const audio = new Audio(ONBOARDING_AUDIO_CATALOG.movement);
    audio.volume = 0.58;
    void audio.play().catch(() => undefined);
  }, [isRewardOverlayVisible]);

  async function claimRewardWithRetry(): Promise<boolean> {
    for (let attempt = 1; attempt <= QUICK_COMPLETE_CLAIM_MAX_ATTEMPTS; attempt += 1) {
      try {
        await postTutorialRewardClaim();
        return true;
      } catch {
        if (attempt < QUICK_COMPLETE_CLAIM_MAX_ATTEMPTS) {
          await waitMilliseconds(220 * attempt);
        }
      }
    }
    return false;
  }

  async function handleQuickComplete(): Promise<void> {
    setIsApplying(true);
    setStatus("Almacenando recompensa y actualizando progreso...");
    try {
      for (const nodeId of TUTORIAL_NODE_IDS_TO_COMPLETE) {
        await postTutorialNodeCompletion(nodeId);
      }
      await postTutorialCombatRewardClaim().catch(() => ({ applied: false, rewardCardId: "" }));
      const hasClaimedReward = await claimRewardWithRetry();
      markTutorialSoundtrackFirstRunFinished();
      const clickAudio = new Audio(ONBOARDING_AUDIO_CATALOG.buttonClick);
      clickAudio.volume = 0.62;
      void clickAudio.play().catch(() => undefined);
      setStatus(hasClaimedReward ? "Actualizando mapa tutorial..." : "Sincronizando progreso final...");
      setIsRewardOverlayVisible(false);
      setIsHidden(true);
      window.setTimeout(() => {
        router.refresh();
      }, 280);
    } catch {
      setStatus("No se pudo completar ahora. Reintenta o reclama desde Recompensa Final.");
    } finally {
      setIsApplying(false);
    }
  }

  function openRewardOverlay(): void {
    onOpenQuickComplete?.();
    window.dispatchEvent(new Event(TUTORIAL_QUICK_COMPLETE_OPENED_EVENT));
    setStatus("Pulsa almacenar recompensa para cerrar el tutorial.");
    setIsRewardOverlayVisible(true);
  }

  function closeRewardOverlay(): void {
    if (isApplying) return;
    setStatus(null);
    setIsRewardOverlayVisible(false);
  }

  if (isHidden) return null;

  return (
    <>
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={openRewardOverlay}
          className="rounded-md border border-emerald-200/45 bg-emerald-950/90 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-emerald-100 transition hover:bg-emerald-900/95"
        >
          Completar tutorial + recompensa
        </button>
        {status ? <p className="text-center text-[11px] font-black uppercase tracking-[0.11em] text-emerald-300">{status}</p> : null}
      </div>

      <CombatTutorialRewardOverlay
        isVisible={isRewardOverlayVisible}
        rewardCard={rewardCard}
        rewardNexus={rewardNexus}
        status={status ?? "Pulsa almacenar recompensa para finalizar tutorial."}
        isLoading={isApplying}
        title="Recompensa de Cierre"
        subtitle="Modo rápido tutorial"
        description="Guarda automáticamente carta y Nexus para completar el tutorial sin recorrer todos los nodos."
        claimLabel="Almacenar recompensa"
        closeLabel="Salir"
        onClaimReward={() => void handleQuickComplete()}
        onClose={closeRewardOverlay}
      />
    </>
  );
}

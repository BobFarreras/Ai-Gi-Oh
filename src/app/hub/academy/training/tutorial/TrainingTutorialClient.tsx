// src/app/hub/academy/training/tutorial/TrainingTutorialClient.tsx - Orquesta tutorial board y sincroniza su finalización cuando el jugador gana.
"use client";
import { useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { TutorialBigLogOutroOverlay } from "@/components/tutorial/flow/TutorialBigLogOutroOverlay";
import { ICard } from "@/core/entities/ICard";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { postTutorialCombatRewardClaim, postTutorialNodeCompletion } from "@/services/tutorial/tutorial-node-progress-client";
import { TrainingCoinTossOverlay } from "./TrainingCoinTossOverlay";
import { createTutorialOpponentStrategy } from "@/app/hub/academy/training/tutorial/internal/create-tutorial-opponent-strategy";
import { CombatTutorialRewardOverlay } from "./CombatTutorialRewardOverlay";

interface ITrainingTutorialClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  seed: string;
}

export function TrainingTutorialClient(props: ITrainingTutorialClientProps) {
  const tutorialOpponentStrategy = useMemo(() => createTutorialOpponentStrategy(), []);
  const tutorialRewardSummary = useMemo<IDuelResultRewardSummary>(() => {
    const mockRewardCard = ENTITY_CARDS.find((card) => card.id === "entity-python") ?? ENTITY_CARDS[0] ?? props.deck[0];
    return {
      rewardPlayerExperience: 180,
      rewardNexus: 260,
      rewardCards: mockRewardCard ? [{ ...mockRewardCard }] : [],
    };
  }, [props.deck]);
  const hasPostedRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const [isCombatTutorialFlowFinished, setIsCombatTutorialFlowFinished] = useState(false);
  const [isRewardDialogVisible, setIsRewardDialogVisible] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimStatus, setRewardClaimStatus] = useState("Pulsa reclamar para añadir la carta al almacén de Supabase.");
  const starterSide: "PLAYER" | "OPPONENT" = "PLAYER";
  const tutorialRewardCard = useMemo(() => EXECUTION_CARDS.find((card) => card.id === "exec-fusion-gemgpt") ?? props.deck[0], [props.deck]);

  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (result.winnerPlayerId !== result.playerId || hasPostedRef.current) {
      if (result.winnerPlayerId !== result.playerId) setStatus("Tutorial no completado. Vuelve a intentarlo.");
      return;
    }
    hasPostedRef.current = true;
    setStatus("Registrando progreso del nodo de combate...");
    try {
      await postTutorialNodeCompletion("tutorial-combat-basics");
      setStatus("Nodo de combate completado y sincronizado.");
    } catch {
      setStatus("No se pudo sincronizar el nodo de combate.");
      hasPostedRef.current = false;
    }
  }

  return (
    <div className="relative h-screen overflow-hidden bg-zinc-950">
      {status ? <p className="absolute left-3 top-3 z-[320] rounded-md bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-100">{status}</p> : null}
      <Board
        mode="TUTORIAL"
        initialPlayerDeck={props.deck}
        initialConfig={{
          playerFusionDeck: props.fusionDeck,
          opponentDeck: props.opponentDeck,
          opponentFusionDeck: props.opponentFusionDeck,
          opponentName: "BigLog",
          starterPlayerId: starterSide === "PLAYER" ? "player-local" : "opponent-local",
          seed: props.seed,
          preserveDeckOrder: true,
          openingHandSize: 4,
        }}
        playerAvatarUrl="/assets/story/player/bob.png"
        opponentAvatarUrl="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png"
        isMatchStartLocked={isCoinTossVisible}
        isTurnTimerEnabled={false}
        suppressCombatFeedback={false}
        suppressCombatBanners={false}
        opponentStrategyOverride={tutorialOpponentStrategy}
        duelResultRewardSummary={tutorialRewardSummary}
        resultActionLabel="Volver a selección"
        onResultAction={() => window.location.replace("/hub/academy")}
        onExitMatch={() => window.location.replace("/hub/academy")}
        onMatchResolved={handleMatchResolved}
        onTutorialFlowFinished={() => setIsCombatTutorialFlowFinished(true)}
      />
      <TutorialBigLogOutroOverlay
        isVisible={!isCoinTossVisible && isCombatTutorialFlowFinished && !isRewardDialogVisible}
        title="Tutorial de Combate Completado"
        description="Has completado todos los pasos. Pulsa Recompensa Final para reclamar la carta mágica de fusión de GemGPT."
        continueLabel="Recompensa Final"
        hideExitButton
        onContinue={() => setIsRewardDialogVisible(true)}
        onExit={() => undefined}
      />
      {tutorialRewardCard ? (
        <CombatTutorialRewardOverlay
          isVisible={isRewardDialogVisible}
          rewardCard={tutorialRewardCard}
          isLoading={isClaimingReward}
          status={rewardClaimStatus}
          onClaimReward={async () => {
            setIsClaimingReward(true);
            try {
              const result = await postTutorialCombatRewardClaim();
              setRewardClaimStatus(result.applied ? "Carta reclamada y añadida al almacén correctamente." : "La carta ya estaba reclamada en tu almacén.");
            } catch {
              setRewardClaimStatus("No se pudo reclamar la carta ahora. Inténtalo de nuevo.");
            } finally {
              setIsClaimingReward(false);
            }
          }}
          onClose={() => window.location.assign("/hub/academy/tutorial")}
        />
      ) : null}
      <TrainingCoinTossOverlay
        isVisible={isCoinTossVisible}
        starterSide={starterSide}
        onContinue={() => setIsCoinTossVisible(false)}
      />
    </div>
  );
}

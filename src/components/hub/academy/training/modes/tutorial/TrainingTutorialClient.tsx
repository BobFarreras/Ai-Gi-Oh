// src/components/hub/academy/training/modes/tutorial/TrainingTutorialClient.tsx - Orquesta tutorial board y sincroniza su finalización cuando el jugador gana.
"use client";
import { useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { TutorialBigLogOutroOverlay } from "@/components/tutorial/flow/TutorialBigLogOutroOverlay";
import { ICard } from "@/core/entities/ICard";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { ACADEMY_HOME_ROUTE, ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { postTutorialCombatRewardClaim, postTutorialRewardClaim } from "@/services/tutorial/tutorial-node-progress-client";
import { TrainingCoinTossOverlay } from "./TrainingCoinTossOverlay";
import { createTutorialOpponentStrategy } from "@/components/hub/academy/training/modes/tutorial/internal/create-tutorial-opponent-strategy";
import { CombatTutorialRewardOverlay } from "./CombatTutorialRewardOverlay";
import { ensureCombatNodeCompletion } from "@/components/hub/academy/training/modes/tutorial/internal/ensure-combat-node-completion";
import { ACADEMY_POST_TUTORIAL_OVERLAY_QUERY } from "@/components/hub/academy/internal/AcademyPostTutorialBigLogOverlay";
import { markTutorialSoundtrackFirstRunFinished } from "@/components/hub/academy/tutorial/internal/tutorial-soundtrack-session";

interface ITrainingTutorialClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  seed: string;
}

export function TrainingTutorialClient(props: ITrainingTutorialClientProps) {
  const FINAL_TUTORIAL_NEXUS_REWARD = 600;
  const tutorialOpponentStrategy = useMemo(() => createTutorialOpponentStrategy(), []);
  const tutorialRewardSummary = useMemo<IDuelResultRewardSummary>(() => {
    const mockRewardCard = EXECUTION_CARDS.find((card) => card.id === "exec-fusion-gemgpt") ?? ENTITY_CARDS[0] ?? props.deck[0];
    return {
      rewardPlayerExperience: 180,
      rewardNexus: FINAL_TUTORIAL_NEXUS_REWARD,
      rewardCards: mockRewardCard ? [{ ...mockRewardCard }] : [],
    };
  }, [props.deck]);
  const hasPostedRef = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const [isCombatTutorialFlowFinished, setIsCombatTutorialFlowFinished] = useState(false);
  const [isRewardDialogVisible, setIsRewardDialogVisible] = useState(false);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [hasRewardClaimCompleted, setHasRewardClaimCompleted] = useState(false);
  const [rewardClaimStatus, setRewardClaimStatus] = useState("Pulsa reclamar para añadir la carta y los Nexus finales.");
  const [resolvedRewardNexus, setResolvedRewardNexus] = useState(FINAL_TUTORIAL_NEXUS_REWARD);
  const starterSide: "PLAYER" | "OPPONENT" = "PLAYER";
  const tutorialRewardCard = useMemo(() => EXECUTION_CARDS.find((card) => card.id === "exec-fusion-gemgpt") ?? props.deck[0], [props.deck]);

  /**
   * Marca el nodo de combate al ganar y evita duplicar escrituras durante re-renders.
   */
  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string }) {
    if (result.winnerPlayerId !== result.playerId || hasPostedRef.current) {
      if (result.winnerPlayerId !== result.playerId) setStatus("Tutorial no completado. Vuelve a intentarlo.");
      return;
    }
    hasPostedRef.current = true;
    setStatus("Registrando progreso del nodo de combate...");
    try {
      const synced = await ensureCombatNodeCompletion();
      setStatus(synced ? "Nodo de combate completado y sincronizado." : "No se pudo sincronizar el nodo de combate.");
      if (!synced) hasPostedRef.current = false;
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
        onResultAction={() => window.location.replace(ACADEMY_HOME_ROUTE)}
        onExitMatch={() => window.location.replace(ACADEMY_HOME_ROUTE)}
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
          rewardNexus={resolvedRewardNexus}
          isLoading={isClaimingReward}
          hideClaimButton={hasRewardClaimCompleted}
          status={rewardClaimStatus}
          onClaimReward={async () => {
            setIsClaimingReward(true);
            try {
              await ensureCombatNodeCompletion();
              const [cardResult, nexusResult] = await Promise.all([
                postTutorialCombatRewardClaim(),
                postTutorialRewardClaim(),
              ]);
              setResolvedRewardNexus(nexusResult.rewardNexus);
              const cardText = cardResult.applied ? "carta añadida" : "carta ya reclamada";
              const nexusText = nexusResult.applied ? `+${nexusResult.rewardNexus} Nexus aplicados` : "Nexus ya reclamados";
              setRewardClaimStatus(`Recompensa final completada: ${cardText}, ${nexusText}.`);
              setHasRewardClaimCompleted(true);
              markTutorialSoundtrackFirstRunFinished();
              window.setTimeout(() => {
                window.location.assign(`${ACADEMY_HOME_ROUTE}?${ACADEMY_POST_TUTORIAL_OVERLAY_QUERY.key}=${ACADEMY_POST_TUTORIAL_OVERLAY_QUERY.value}`);
              }, 700);
            } catch {
              setRewardClaimStatus("No se pudo reclamar la recompensa final ahora. Inténtalo de nuevo.");
            } finally {
              setIsClaimingReward(false);
            }
          }}
          onClose={async () => {
            await ensureCombatNodeCompletion();
            window.location.assign(`${ACADEMY_TUTORIAL_MAP_ROUTE}?refresh=${Date.now()}`);
          }}
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

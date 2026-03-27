// src/components/game/board/internal/BoardTutorialFlowOverlay.tsx - Overlay narrativo de BigLog para tutorial de combate con avance por eventos reales.
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialBigLogIntroOverlay } from "@/components/tutorial/flow/TutorialBigLogIntroOverlay";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { resolveCombatTutorialSteps } from "@/services/tutorial/combat/resolve-combat-tutorial-steps";
import {
  countTurnStartedByActor,
} from "@/components/game/board/internal/board-tutorial-flow-events";
import {
  isBoardTutorialDirectAttackGuidedStep,
  isBoardTutorialExecutionShowcaseStep,
  resolveBoardTutorialFlowSignals,
} from "@/components/game/board/internal/board-tutorial-flow-signals";
import { syncBoardTutorialStep } from "@/components/game/board/internal/board-tutorial-flow-sync";

interface IBoardTutorialFlowOverlayProps {
  combatLog: ICombatLogEvent[];
  selectedCardId: string | null;
  phase: string;
  isGraveyardOpen: boolean;
  isFusionCinematicActive: boolean;
  fusionSelectedCount: number;
  isFusionBrowserOpen: boolean;
  hasWinner: boolean;
  onFlowFinished?: () => void;
}

export function BoardTutorialFlowOverlay(props: IBoardTutorialFlowOverlayProps) {
  const { combatLog, selectedCardId, phase, isGraveyardOpen, isFusionCinematicActive, fusionSelectedCount, isFusionBrowserOpen, hasWinner, onFlowFinished } = props;
  const steps = useMemo(() => resolveCombatTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const scheduledStepActionsRef = useRef<Record<string, number>>({});
  const passTurnStepOpponentPlaysRef = useRef<number | null>(null);
  const passTurnStepPlayerTurnsRef = useRef<number | null>(null);
  const hasNotifiedFlowFinishedRef = useRef(false);
  const signals = useMemo(() => resolveBoardTutorialFlowSignals({ combatLog, selectedCardId }), [combatLog, selectedCardId]);
  const opponentCardPlayedCount = signals.opponentCardPlayedCount;
  const playerTurnStartedCount = countTurnStartedByActor(combatLog, "player-local");

  useEffect(
    () => () => {
      Object.values(scheduledStepActionsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      scheduledStepActionsRef.current = {};
    },
    [],
  );

  useEffect(() => {
    if (tutorial.currentStep?.id === "combat-fusion-pass-turn" && passTurnStepOpponentPlaysRef.current === null) {
      passTurnStepOpponentPlaysRef.current = opponentCardPlayedCount;
      passTurnStepPlayerTurnsRef.current = playerTurnStartedCount;
      return;
    }
    if (tutorial.currentStep?.id !== "combat-fusion-pass-turn") {
      passTurnStepOpponentPlaysRef.current = null;
      passTurnStepPlayerTurnsRef.current = null;
    }
  }, [opponentCardPlayedCount, playerTurnStartedCount, tutorial.currentStep?.id]);

  useEffect(() => {
    if (!tutorial.isFinished || hasNotifiedFlowFinishedRef.current) return;
    hasNotifiedFlowFinishedRef.current = true;
    onFlowFinished?.();
  }, [onFlowFinished, tutorial.isFinished]);

  useEffect(() => {
    const shouldLockScroll = isIntroVisible || !tutorial.isFinished;
    if (!shouldLockScroll) return;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isIntroVisible, tutorial.isFinished]);

  const queueStepAction = useCallback(
    (stepId: string, actionId: string, delayMs = 0): void => {
      if (tutorial.currentStep?.id !== stepId) return;
      if (delayMs <= 0) {
        tutorial.onAction(actionId);
        return;
      }
      if (scheduledStepActionsRef.current[stepId]) return;
      scheduledStepActionsRef.current[stepId] = window.setTimeout(() => {
        delete scheduledStepActionsRef.current[stepId];
        tutorial.onAction(actionId);
      }, delayMs);
    },
    [tutorial],
  );

  useEffect(() => {
    const hasOpponentResponseAfterPass =
      passTurnStepOpponentPlaysRef.current !== null && opponentCardPlayedCount > passTurnStepOpponentPlaysRef.current;
    const hasPlayerTurnReturnedAfterPass =
      passTurnStepPlayerTurnsRef.current !== null && playerTurnStartedCount > passTurnStepPlayerTurnsRef.current;
    syncBoardTutorialStep({
      currentStepId: tutorial.currentStep?.id,
      selectedCardId,
      phase,
      isGraveyardOpen,
      isFusionBrowserOpen,
      fusionSelectedCount,
      hasWinner,
      signals,
      hasOpponentResponseAfterPass,
      hasPlayerTurnReturnedAfterPass,
      queueStepAction,
    });
  }, [fusionSelectedCount, hasWinner, isFusionBrowserOpen, isGraveyardOpen, opponentCardPlayedCount, phase, playerTurnStartedCount, queueStepAction, selectedCardId, signals, tutorial.currentStep?.id]);

  const isExecutionShowcaseStep = isBoardTutorialExecutionShowcaseStep(tutorial.currentStep?.id, isFusionCinematicActive);
  const isDirectAttackGuidedStep = isBoardTutorialDirectAttackGuidedStep(tutorial.currentStep?.id);

  return (
    <>
      <TutorialInteractionGuard isEnabled={isIntroVisible || !tutorial.isFinished} allowedTargetIds={isIntroVisible ? [] : tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay
        isVisible={!isIntroVisible && !tutorial.isFinished && !isExecutionShowcaseStep}
        targetId={tutorial.currentStep?.targetId ?? null}
        backdropOpacity={isDirectAttackGuidedStep ? 0.06 : 0.78}
        disableAutoScroll
      />
      <TutorialBigLogIntroOverlay
        isVisible={isIntroVisible}
        title="Combate Base"
        description="En este duelo aprenderás turnos, ataque y defensa, mágicas, fusión, cementerio y lectura del combat log."
        onStart={() => setIsIntroVisible(false)}
      />
      {!isIntroVisible && !isFusionCinematicActive ? (
        <TutorialBigLogDialog
          title={tutorial.currentStep?.title ?? "Tutorial de combate completado"}
          description={tutorial.currentStep?.description ?? "Has cubierto las mecánicas base del duelo. Puedes repetir el nodo cuando quieras."}
          targetId={tutorial.currentStep?.targetId ?? null}
          canUseNext={tutorial.canUseNext}
          isFinished={tutorial.isFinished}
          preferTopPlacement
          disableAutoScrollWhenPinnedTop
          shouldHighlightNextButton
          onNext={tutorial.onNext}
        />
      ) : null}
    </>
  );
}

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

interface IBoardTutorialFlowOverlayProps {
  combatLog: ICombatLogEvent[];
  selectedCardId: string | null;
  isMuted: boolean;
  hasWinner: boolean;
}

function hasEvent(events: ICombatLogEvent[], eventType: ICombatLogEvent["eventType"]): boolean {
  return events.some((event) => event.eventType === eventType);
}

function hasCardPlayed(events: ICombatLogEvent[], cardId: string, mode?: string): boolean {
  return events.some((event) => {
    if (event.eventType !== "CARD_PLAYED") return false;
    const sameCard = event.payload.cardId === cardId;
    if (!sameCard) return false;
    return mode ? event.payload.mode === mode : true;
  });
}

function hasOpponentTurnStarted(events: ICombatLogEvent[]): boolean {
  return events.some((event) => event.eventType === "TURN_STARTED" && event.actorPlayerId === "opponent-local");
}

function hasChatGptDestroyed(events: ICombatLogEvent[]): boolean {
  return events.some(
    (event) =>
      (event.eventType === "CARD_TO_GRAVEYARD" || event.eventType === "CARD_TO_DESTROYED") &&
      event.payload.cardId === "entity-chatgpt" &&
      event.payload.ownerPlayerId === "player-local",
  );
}

function hasTrapResolution(events: ICombatLogEvent[]): boolean {
  return events.some((event) => event.eventType === "TRAP_TRIGGERED");
}

export function BoardTutorialFlowOverlay(props: IBoardTutorialFlowOverlayProps) {
  const { combatLog, selectedCardId, isMuted, hasWinner } = props;
  const steps = useMemo(() => resolveCombatTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const scheduledStepActionsRef = useRef<Record<string, number>>({});
  const lastMutedRef = useRef(isMuted);
  const hasFusionSummon = hasEvent(combatLog, "FUSION_SUMMONED");
  const hasChatgptAttackSummon = hasCardPlayed(combatLog, "entity-chatgpt", "ATTACK");
  const hasGeminiAttackSummon = hasCardPlayed(combatLog, "entity-gemini", "ATTACK");
  const hasBoostActivated = hasCardPlayed(combatLog, "exec-boost-atk-400", "ACTIVATE");
  const hasTutorialTrapSet = hasCardPlayed(combatLog, "tutorial-trap-attack-drain-200", "SET");
  const hasEnergyRestoreActivated = hasCardPlayed(combatLog, "tutorial-exec-energy-restore", "ACTIVATE");
  const hasOpponentTurn = hasOpponentTurnStarted(combatLog);
  const hasTrapDefenseResolved = hasTrapResolution(combatLog);
  const hasChatgptWasDestroyed = hasChatGptDestroyed(combatLog);

  useEffect(
    () => () => {
      Object.values(scheduledStepActionsRef.current).forEach((timeoutId) => window.clearTimeout(timeoutId));
      scheduledStepActionsRef.current = {};
    },
    [],
  );

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
    const currentStepId = tutorial.currentStep?.id;
    if (currentStepId === "combat-select-chatgpt" && selectedCardId === "entity-chatgpt") queueStepAction("combat-select-chatgpt", "SELECT_CHATGPT");
    if (currentStepId === "combat-summon-chatgpt-attack" && hasChatgptAttackSummon) queueStepAction("combat-summon-chatgpt-attack", "SUMMON_CHATGPT_ATTACK");
    if (currentStepId === "combat-select-boost" && selectedCardId === "exec-boost-atk-400") queueStepAction("combat-select-boost", "SELECT_BOOST_EXECUTION");
    if (currentStepId === "combat-activate-boost" && hasBoostActivated) queueStepAction("combat-activate-boost", "ACTIVATE_BOOST_EXECUTION", 1300);
    if (currentStepId === "combat-select-trap" && selectedCardId === "tutorial-trap-attack-drain-200") queueStepAction("combat-select-trap", "SELECT_TUTORIAL_TRAP");
    if (currentStepId === "combat-set-trap" && hasTutorialTrapSet) queueStepAction("combat-set-trap", "SET_TUTORIAL_TRAP");
    if (currentStepId === "combat-subturns" && hasOpponentTurn) queueStepAction("combat-subturns", "TURN_PASSED_TO_OPPONENT");
    if (currentStepId === "combat-opponent-trap-resolution" && hasTrapDefenseResolved) queueStepAction("combat-opponent-trap-resolution", "TRAP_DEFENSE_RESOLVED", 1450);
    if (currentStepId === "combat-select-gemini" && selectedCardId === "entity-gemini") queueStepAction("combat-select-gemini", "SELECT_GEMINI");
    if (currentStepId === "combat-select-energy-restore" && selectedCardId === "tutorial-exec-energy-restore") queueStepAction("combat-select-energy-restore", "SELECT_ENERGY_RESTORE");
    if (currentStepId === "combat-activate-energy-restore" && hasEnergyRestoreActivated) queueStepAction("combat-activate-energy-restore", "ACTIVATE_ENERGY_RESTORE", 1300);
    if (currentStepId === "combat-summon-gemini" && hasGeminiAttackSummon) queueStepAction("combat-summon-gemini", "SUMMON_GEMINI_ATTACK");
    if (currentStepId === "combat-pass-opponent-strong" && hasChatgptWasDestroyed) queueStepAction("combat-pass-opponent-strong", "CHATGPT_DESTROYED", 800);
    if (currentStepId === "combat-draw-and-fusion" && hasFusionSummon) queueStepAction("combat-draw-and-fusion", "FUSION_SUMMON", 1000);
    if (currentStepId === "combat-defense-attack-example" && hasWinner) queueStepAction("combat-defense-attack-example", "MATCH_WON");
  }, [hasBoostActivated, hasChatgptAttackSummon, hasChatgptWasDestroyed, hasEnergyRestoreActivated, hasFusionSummon, hasGeminiAttackSummon, hasOpponentTurn, hasTrapDefenseResolved, hasTutorialTrapSet, hasWinner, queueStepAction, selectedCardId, tutorial]);

  useEffect(() => {
    if (tutorial.currentStep?.id === "combat-ui-mute" && lastMutedRef.current !== isMuted) queueStepAction("combat-ui-mute", "TOGGLE_MUTE");
    lastMutedRef.current = isMuted;
  }, [isMuted, queueStepAction, tutorial.currentStep?.id]);

  const isExecutionShowcaseStep =
    tutorial.currentStep?.id === "combat-activate-boost" ||
    tutorial.currentStep?.id === "combat-activate-energy-restore" ||
    tutorial.currentStep?.id === "combat-opponent-trap-resolution";

  return (
    <>
      <TutorialInteractionGuard isEnabled={isIntroVisible || !tutorial.isFinished} allowedTargetIds={isIntroVisible ? [] : tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay isVisible={!isIntroVisible && !tutorial.isFinished && !isExecutionShowcaseStep} targetId={tutorial.currentStep?.targetId ?? null} />
      <TutorialBigLogIntroOverlay
        isVisible={isIntroVisible}
        title="Combate Base"
        description="En este duelo aprenderás turnos, ataque y defensa, mágicas, fusión, cementerio y lectura del combat log."
        onStart={() => setIsIntroVisible(false)}
      />
      {!isIntroVisible ? (
        <TutorialBigLogDialog
          title={tutorial.currentStep?.title ?? "Tutorial de combate completado"}
          description={tutorial.currentStep?.description ?? "Has cubierto las mecánicas base del duelo. Puedes repetir el nodo cuando quieras."}
          canUseNext={tutorial.canUseNext}
          isFinished={tutorial.isFinished}
          onNext={tutorial.onNext}
        />
      ) : null}
    </>
  );
}

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
  countOpponentCardPlayed,
  countPlayerDirectDamage,
  countTurnStartedByActor,
  countTrapResolutions,
  hasCardPlayed,
  hasEvent,
  hasPlayerBattleResolvedAgainstEntity,
  hasPlayerDirectAttackByCard,
  hasOpponentCardPlayedInMode,
  hasOpponentTurnStarted,
  hasPlayerBattlePhase,
  hasTrapResolution,
} from "@/components/game/board/internal/board-tutorial-flow-events";

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
  const hasFusionSummon = hasEvent(combatLog, "FUSION_SUMMONED");
  const hasChatgptAttackSummon = hasCardPlayed(combatLog, "entity-chatgpt", "ATTACK");
  const hasGeminiAttackSummon = hasCardPlayed(combatLog, "entity-gemini", "ATTACK");
  const hasBoostActivated = hasCardPlayed(combatLog, "exec-boost-atk-400", "ACTIVATE");
  const hasTutorialTrapSet = hasCardPlayed(combatLog, "tutorial-trap-attack-drain-200", "SET");
  const hasEnergyRestoreActivated = hasCardPlayed(combatLog, "tutorial-exec-energy-restore", "ACTIVATE");
  const hasFusionMagicSelected = selectedCardId === "exec-fusion-gemgpt";
  const hasOpponentSetCard = hasCardPlayed(combatLog, "tutorial-opp-shock-trap", "SET");
  const hasOpponentDefenseCard = hasOpponentCardPlayedInMode(combatLog, "DEFENSE");
  const opponentCardPlayedCount = countOpponentCardPlayed(combatLog);
  const hasPythonAttackSummon = hasCardPlayed(combatLog, "entity-python", "ATTACK");
  const hasOpponentTurn = hasOpponentTurnStarted(combatLog);
  const hasPlayerToBattle = hasPlayerBattlePhase(combatLog);
  const hasFusionAttackAgainstDefense = hasPlayerBattleResolvedAgainstEntity(combatLog, "fusion-gemgpt");
  const hasPythonDirectAttack = hasPlayerDirectAttackByCard(combatLog, "entity-python");
  const playerDirectDamageCount = countPlayerDirectDamage(combatLog);
  const playerTurnStartedCount = countTurnStartedByActor(combatLog, "player-local");
  const trapResolutionCount = countTrapResolutions(combatLog);
  const hasTrapDefenseResolved = hasTrapResolution(combatLog);

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
    const currentStepId = tutorial.currentStep?.id;
    if (currentStepId === "combat-select-chatgpt" && selectedCardId === "entity-chatgpt") queueStepAction("combat-select-chatgpt", "SELECT_CHATGPT");
    if (currentStepId === "combat-summon-chatgpt-attack" && hasChatgptAttackSummon) queueStepAction("combat-summon-chatgpt-attack", "SUMMON_CHATGPT_ATTACK");
    if (currentStepId === "combat-select-boost" && selectedCardId === "exec-boost-atk-400") queueStepAction("combat-select-boost", "SELECT_BOOST_EXECUTION");
    if (currentStepId === "combat-activate-boost" && hasBoostActivated) queueStepAction("combat-activate-boost", "ACTIVATE_BOOST_EXECUTION", 1300);
    if (currentStepId === "combat-select-trap" && selectedCardId === "tutorial-trap-attack-drain-200") queueStepAction("combat-select-trap", "SELECT_TUTORIAL_TRAP");
    if (currentStepId === "combat-set-trap" && hasTutorialTrapSet) queueStepAction("combat-set-trap", "SET_TUTORIAL_TRAP");
    if (currentStepId === "combat-subturns-battle" && hasPlayerToBattle) queueStepAction("combat-subturns-battle", "TURN_TO_BATTLE");
    if (currentStepId === "combat-subturns-pass" && hasOpponentTurn) queueStepAction("combat-subturns-pass", "TURN_PASSED_TO_OPPONENT");
    if (currentStepId === "combat-opponent-trap-resolution" && hasTrapDefenseResolved) queueStepAction("combat-opponent-trap-resolution", "TRAP_DEFENSE_RESOLVED", 1450);
    if (currentStepId === "combat-energy-restored" && selectedCardId === "entity-gemini") queueStepAction("combat-energy-restored", "SELECT_GEMINI");
    if (currentStepId === "combat-select-energy-restore" && selectedCardId === "tutorial-exec-energy-restore") queueStepAction("combat-select-energy-restore", "SELECT_ENERGY_RESTORE");
    if (currentStepId === "combat-activate-energy-restore" && hasEnergyRestoreActivated) queueStepAction("combat-activate-energy-restore", "ACTIVATE_ENERGY_RESTORE", 1300);
    if (currentStepId === "combat-summon-gemini" && hasGeminiAttackSummon) queueStepAction("combat-summon-gemini", "SUMMON_GEMINI_ATTACK");
    if (currentStepId === "combat-direct-attack-enter-battle" && phase === "BATTLE") queueStepAction("combat-direct-attack-enter-battle", "TURN_TO_BATTLE_FOR_DIRECT_ATTACK");
    if (currentStepId === "combat-direct-attack-guide" && selectedCardId === "entity-chatgpt") queueStepAction("combat-direct-attack-guide", "SELECT_CHATGPT_BOARD_ATTACK");
    if (currentStepId === "combat-direct-attack-chatgpt" && playerDirectDamageCount >= 1) queueStepAction("combat-direct-attack-chatgpt", "PLAYER_DIRECT_ATTACK_1_DONE");
    if (currentStepId === "combat-direct-attack-gemini-select" && selectedCardId === "entity-gemini") queueStepAction("combat-direct-attack-gemini-select", "SELECT_GEMINI_BOARD_ATTACK");
    if (currentStepId === "combat-direct-attack-gemini" && playerDirectDamageCount >= 2) queueStepAction("combat-direct-attack-gemini", "PLAYER_DIRECT_ATTACK_2_DONE");
    if (currentStepId === "combat-pass-opponent-set" && hasOpponentSetCard) queueStepAction("combat-pass-opponent-set", "OPPONENT_SET_DONE", 800);
    if (currentStepId === "combat-select-fusion-magic" && hasFusionMagicSelected) queueStepAction("combat-select-fusion-magic", "SELECT_FUSION_MAGIC");
    if (currentStepId === "combat-activate-fusion-magic" && isFusionBrowserOpen) queueStepAction("combat-activate-fusion-magic", "FUSION_BROWSER_OPEN", 200);
    if (currentStepId === "combat-fusion-material-1" && (fusionSelectedCount >= 1 || hasFusionSummon)) {
      queueStepAction("combat-fusion-material-1", "FUSION_MATERIAL_1_SELECTED");
    }
    if (currentStepId === "combat-fusion-material-2" && (fusionSelectedCount >= 2 || hasFusionSummon || !isFusionBrowserOpen)) {
      queueStepAction("combat-fusion-material-2", "FUSION_MATERIAL_2_SELECTED");
    }
    if (currentStepId === "combat-fusion-summon-animation" && hasFusionSummon) queueStepAction("combat-fusion-summon-animation", "FUSION_SUMMON", 1000);
    if (currentStepId === "combat-fusion-battle-phase" && phase === "BATTLE") queueStepAction("combat-fusion-battle-phase", "TURN_TO_BATTLE_AFTER_FUSION");
    if (currentStepId === "combat-fusion-select-card" && selectedCardId === "fusion-gemgpt") queueStepAction("combat-fusion-select-card", "SELECT_FUSION_ENTITY_FOR_ATTACK");
    if (currentStepId === "combat-fusion-direct-attack" && playerDirectDamageCount >= 3) queueStepAction("combat-fusion-direct-attack", "PLAYER_FUSION_DIRECT_ATTACK_DONE");
    if (currentStepId === "combat-fusion-trap-explained" && trapResolutionCount >= 2) queueStepAction("combat-fusion-trap-explained", "FUSION_ATTACK_TRAP_TRIGGERED");
    const hasOpponentResponseAfterPass =
      passTurnStepOpponentPlaysRef.current !== null && opponentCardPlayedCount > passTurnStepOpponentPlaysRef.current;
    const hasPlayerTurnReturnedAfterPass =
      passTurnStepPlayerTurnsRef.current !== null && playerTurnStartedCount > passTurnStepPlayerTurnsRef.current;
    if (currentStepId === "combat-fusion-pass-turn" && (hasOpponentDefenseCard || hasOpponentResponseAfterPass || hasPlayerTurnReturnedAfterPass)) {
      queueStepAction("combat-fusion-pass-turn", "OPPONENT_DEFENSE_READY", 900);
    }
    if (currentStepId === "combat-select-python" && selectedCardId === "entity-python") queueStepAction("combat-select-python", "SELECT_PYTHON");
    if (currentStepId === "combat-summon-python" && hasPythonAttackSummon) queueStepAction("combat-summon-python", "SUMMON_PYTHON_ATTACK");
    if (currentStepId === "combat-graveyard-open" && isGraveyardOpen) queueStepAction("combat-graveyard-open", "OPEN_GRAVEYARD");
    if (currentStepId === "combat-graveyard-close" && !isGraveyardOpen) queueStepAction("combat-graveyard-close", "CLOSE_GRAVEYARD");
    if (currentStepId === "combat-python-battle-phase" && phase === "BATTLE") queueStepAction("combat-python-battle-phase", "TURN_TO_BATTLE_PYTHON");
    if (currentStepId === "combat-fusion-defense-attack" && hasFusionAttackAgainstDefense) queueStepAction("combat-fusion-defense-attack", "FUSION_ATTACK_DEFENSE_DONE");
    if (currentStepId === "combat-python-direct-attack-final" && hasPythonDirectAttack) queueStepAction("combat-python-direct-attack-final", "PYTHON_DIRECT_ATTACK_DONE");
    if (currentStepId === "combat-win-confirmed" && hasWinner) queueStepAction("combat-win-confirmed", "MATCH_WON");
  }, [fusionSelectedCount, hasBoostActivated, hasChatgptAttackSummon, hasEnergyRestoreActivated, hasFusionAttackAgainstDefense, hasFusionSummon, hasFusionMagicSelected, hasGeminiAttackSummon, hasOpponentDefenseCard, hasOpponentSetCard, hasOpponentTurn, hasPlayerToBattle, hasPythonAttackSummon, hasPythonDirectAttack, hasTrapDefenseResolved, hasTutorialTrapSet, hasWinner, isFusionBrowserOpen, isGraveyardOpen, opponentCardPlayedCount, phase, playerDirectDamageCount, playerTurnStartedCount, queueStepAction, selectedCardId, trapResolutionCount, tutorial]);

  const isExecutionShowcaseStep =
    tutorial.currentStep?.id === "combat-activate-boost" ||
    tutorial.currentStep?.id === "combat-activate-energy-restore" ||
    tutorial.currentStep?.id === "combat-opponent-trap-resolution" ||
    tutorial.currentStep?.id === "combat-fusion-summon-animation" ||
    isFusionCinematicActive;
  const isDirectAttackGuidedStep =
    tutorial.currentStep?.id === "combat-direct-attack-guide" ||
    tutorial.currentStep?.id === "combat-direct-attack-chatgpt" ||
    tutorial.currentStep?.id === "combat-direct-attack-gemini-select" ||
    tutorial.currentStep?.id === "combat-direct-attack-gemini" ||
    tutorial.currentStep?.id === "combat-fusion-select-card" ||
    tutorial.currentStep?.id === "combat-fusion-direct-attack" ||
    tutorial.currentStep?.id === "combat-fusion-defense-attack" ||
    tutorial.currentStep?.id === "combat-python-direct-attack-final";

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

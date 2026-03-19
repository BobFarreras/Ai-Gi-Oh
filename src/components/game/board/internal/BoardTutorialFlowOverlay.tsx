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
import { countPlayerDirectDamage, hasCardPlayed, hasEvent, hasOpponentTurnStarted, hasPlayerBattlePhase, hasTrapResolution } from "@/components/game/board/internal/board-tutorial-flow-events";

interface IBoardTutorialFlowOverlayProps {
  combatLog: ICombatLogEvent[];
  selectedCardId: string | null;
  phase: string;
  fusionSelectedCount: number;
  isFusionBrowserOpen: boolean;
  hasWinner: boolean;
}

export function BoardTutorialFlowOverlay(props: IBoardTutorialFlowOverlayProps) {
  const { combatLog, selectedCardId, phase, fusionSelectedCount, isFusionBrowserOpen, hasWinner } = props;
  const steps = useMemo(() => resolveCombatTutorialSteps(), []);
  const tutorial = useTutorialFlowController(steps);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const scheduledStepActionsRef = useRef<Record<string, number>>({});
  const hasFusionSummon = hasEvent(combatLog, "FUSION_SUMMONED");
  const hasChatgptAttackSummon = hasCardPlayed(combatLog, "entity-chatgpt", "ATTACK");
  const hasGeminiAttackSummon = hasCardPlayed(combatLog, "entity-gemini", "ATTACK");
  const hasBoostActivated = hasCardPlayed(combatLog, "exec-boost-atk-400", "ACTIVATE");
  const hasTutorialTrapSet = hasCardPlayed(combatLog, "tutorial-trap-attack-drain-200", "SET");
  const hasEnergyRestoreActivated = hasCardPlayed(combatLog, "tutorial-exec-energy-restore", "ACTIVATE");
  const hasFusionMagicSelected = selectedCardId === "exec-fusion-gemgpt";
  const hasOpponentSetCard = hasCardPlayed(combatLog, "tutorial-opp-shock-trap", "SET");
  const hasOpponentDefenseCard = hasCardPlayed(combatLog, "tutorial-opp-guard-gamma", "DEFENSE");
  const hasPythonAttackSummon = hasCardPlayed(combatLog, "entity-python", "ATTACK");
  const hasOpponentTurn = hasOpponentTurnStarted(combatLog);
  const hasPlayerToBattle = hasPlayerBattlePhase(combatLog);
  const playerDirectDamageCount = countPlayerDirectDamage(combatLog);
  const hasTrapDefenseResolved = hasTrapResolution(combatLog);

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
    if (currentStepId === "combat-fusion-material-1" && fusionSelectedCount >= 1) queueStepAction("combat-fusion-material-1", "FUSION_MATERIAL_1_SELECTED");
    if (currentStepId === "combat-fusion-material-2" && fusionSelectedCount >= 2) queueStepAction("combat-fusion-material-2", "FUSION_MATERIAL_2_SELECTED");
    if (currentStepId === "combat-fusion-summon-animation" && hasFusionSummon) queueStepAction("combat-fusion-summon-animation", "FUSION_SUMMON", 1000);
    if (currentStepId === "combat-fusion-battle-phase" && phase === "BATTLE") queueStepAction("combat-fusion-battle-phase", "TURN_TO_BATTLE_AFTER_FUSION");
    if (currentStepId === "combat-fusion-direct-attack" && hasOpponentDefenseCard) queueStepAction("combat-fusion-direct-attack", "OPPONENT_DEFENSE_READY", 900);
    if (currentStepId === "combat-select-python" && selectedCardId === "entity-python") queueStepAction("combat-select-python", "SELECT_PYTHON");
    if (currentStepId === "combat-summon-python" && hasPythonAttackSummon) queueStepAction("combat-summon-python", "SUMMON_PYTHON_ATTACK");
    if (currentStepId === "combat-python-battle-phase" && phase === "BATTLE") queueStepAction("combat-python-battle-phase", "TURN_TO_BATTLE_PYTHON");
    if (currentStepId === "combat-defense-attack-example" && hasWinner) queueStepAction("combat-defense-attack-example", "MATCH_WON");
  }, [fusionSelectedCount, hasBoostActivated, hasChatgptAttackSummon, hasEnergyRestoreActivated, hasFusionSummon, hasFusionMagicSelected, hasGeminiAttackSummon, hasOpponentDefenseCard, hasOpponentSetCard, hasOpponentTurn, hasPlayerToBattle, hasPythonAttackSummon, hasTrapDefenseResolved, hasTutorialTrapSet, hasWinner, isFusionBrowserOpen, phase, playerDirectDamageCount, queueStepAction, selectedCardId, tutorial]);

  const isExecutionShowcaseStep =
    tutorial.currentStep?.id === "combat-activate-boost" ||
    tutorial.currentStep?.id === "combat-activate-energy-restore" ||
    tutorial.currentStep?.id === "combat-opponent-trap-resolution";
  const isDirectAttackGuidedStep =
    tutorial.currentStep?.id === "combat-direct-attack-guide" ||
    tutorial.currentStep?.id === "combat-direct-attack-chatgpt" ||
    tutorial.currentStep?.id === "combat-direct-attack-gemini-select" ||
    tutorial.currentStep?.id === "combat-direct-attack-gemini";

  return (
    <>
      <TutorialInteractionGuard isEnabled={isIntroVisible || !tutorial.isFinished} allowedTargetIds={isIntroVisible ? [] : tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay
        isVisible={!isIntroVisible && !tutorial.isFinished && !isExecutionShowcaseStep}
        targetId={tutorial.currentStep?.targetId ?? null}
        backdropOpacity={isDirectAttackGuidedStep ? 0.06 : 0.78}
      />
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
          shouldHighlightNextButton
          onNext={tutorial.onNext}
        />
      ) : null}
    </>
  );
}

// src/components/game/board/internal/board-tutorial-flow-sync.ts - Sincroniza avance de pasos tutoriales a partir de señales del combate.
import { IBoardTutorialFlowSignals } from "@/components/game/board/internal/board-tutorial-flow-signals";

interface ISyncBoardTutorialStepInput {
  currentStepId: string | undefined;
  selectedCardId: string | null;
  phase: string;
  isGraveyardOpen: boolean;
  isFusionBrowserOpen: boolean;
  fusionSelectedCount: number;
  hasWinner: boolean;
  signals: IBoardTutorialFlowSignals;
  hasOpponentResponseAfterPass: boolean;
  hasPlayerTurnReturnedAfterPass: boolean;
  queueStepAction: (stepId: string, actionId: string, delayMs?: number) => void;
}

/**
 * Mapea condiciones del combate a transiciones de pasos del tutorial.
 */
export function syncBoardTutorialStep(input: ISyncBoardTutorialStepInput): void {
  const stepId = input.currentStepId;
  if (stepId === "combat-select-chatgpt" && input.selectedCardId === "entity-chatgpt") input.queueStepAction("combat-select-chatgpt", "SELECT_CHATGPT");
  if (stepId === "combat-summon-chatgpt-attack" && input.signals.hasChatgptAttackSummon) input.queueStepAction("combat-summon-chatgpt-attack", "SUMMON_CHATGPT_ATTACK");
  if (stepId === "combat-select-boost" && input.selectedCardId === "exec-boost-atk-400") input.queueStepAction("combat-select-boost", "SELECT_BOOST_EXECUTION");
  if (stepId === "combat-activate-boost" && input.signals.hasBoostActivated) input.queueStepAction("combat-activate-boost", "ACTIVATE_BOOST_EXECUTION", 1300);
  if (stepId === "combat-select-trap" && input.selectedCardId === "tutorial-trap-attack-drain-200") input.queueStepAction("combat-select-trap", "SELECT_TUTORIAL_TRAP");
  if (stepId === "combat-set-trap" && input.signals.hasTutorialTrapSet) input.queueStepAction("combat-set-trap", "SET_TUTORIAL_TRAP");
  if (stepId === "combat-subturns-battle" && input.signals.hasPlayerToBattle) input.queueStepAction("combat-subturns-battle", "TURN_TO_BATTLE");
  if (stepId === "combat-subturns-pass" && input.signals.hasOpponentTurn) input.queueStepAction("combat-subturns-pass", "TURN_PASSED_TO_OPPONENT");
  if (stepId === "combat-opponent-trap-resolution" && input.signals.hasTrapDefenseResolved) input.queueStepAction("combat-opponent-trap-resolution", "TRAP_DEFENSE_RESOLVED", 1450);
  if (stepId === "combat-energy-restored" && input.selectedCardId === "entity-gemini") input.queueStepAction("combat-energy-restored", "SELECT_GEMINI");
  if (stepId === "combat-select-energy-restore" && input.selectedCardId === "tutorial-exec-energy-restore") input.queueStepAction("combat-select-energy-restore", "SELECT_ENERGY_RESTORE");
  if (stepId === "combat-activate-energy-restore" && input.signals.hasEnergyRestoreActivated) input.queueStepAction("combat-activate-energy-restore", "ACTIVATE_ENERGY_RESTORE", 1300);
  if (stepId === "combat-summon-gemini" && input.signals.hasGeminiAttackSummon) input.queueStepAction("combat-summon-gemini", "SUMMON_GEMINI_ATTACK");
  if (stepId === "combat-direct-attack-enter-battle" && input.phase === "BATTLE") input.queueStepAction("combat-direct-attack-enter-battle", "TURN_TO_BATTLE_FOR_DIRECT_ATTACK");
  if (stepId === "combat-direct-attack-guide" && input.selectedCardId === "entity-chatgpt") input.queueStepAction("combat-direct-attack-guide", "SELECT_CHATGPT_BOARD_ATTACK");
  if (stepId === "combat-direct-attack-chatgpt" && input.signals.playerDirectDamageCount >= 1) input.queueStepAction("combat-direct-attack-chatgpt", "PLAYER_DIRECT_ATTACK_1_DONE");
  if (stepId === "combat-direct-attack-gemini-select" && input.selectedCardId === "entity-gemini") input.queueStepAction("combat-direct-attack-gemini-select", "SELECT_GEMINI_BOARD_ATTACK");
  if (stepId === "combat-direct-attack-gemini" && input.signals.playerDirectDamageCount >= 2) input.queueStepAction("combat-direct-attack-gemini", "PLAYER_DIRECT_ATTACK_2_DONE");
  if (stepId === "combat-pass-opponent-set" && input.signals.hasOpponentSetCard) input.queueStepAction("combat-pass-opponent-set", "OPPONENT_SET_DONE", 800);
  if (stepId === "combat-select-fusion-magic" && input.signals.hasFusionMagicSelected) input.queueStepAction("combat-select-fusion-magic", "SELECT_FUSION_MAGIC");
  if (stepId === "combat-activate-fusion-magic" && input.isFusionBrowserOpen) input.queueStepAction("combat-activate-fusion-magic", "FUSION_BROWSER_OPEN", 200);
  if (stepId === "combat-fusion-material-1" && (input.fusionSelectedCount >= 1 || input.signals.hasFusionSummon)) input.queueStepAction("combat-fusion-material-1", "FUSION_MATERIAL_1_SELECTED");
  if (stepId === "combat-fusion-material-2" && (input.fusionSelectedCount >= 2 || input.signals.hasFusionSummon || !input.isFusionBrowserOpen)) input.queueStepAction("combat-fusion-material-2", "FUSION_MATERIAL_2_SELECTED");
  if (stepId === "combat-fusion-summon-animation" && input.signals.hasFusionSummon) input.queueStepAction("combat-fusion-summon-animation", "FUSION_SUMMON", 1000);
  if (stepId === "combat-fusion-battle-phase" && input.phase === "BATTLE") input.queueStepAction("combat-fusion-battle-phase", "TURN_TO_BATTLE_AFTER_FUSION");
  if (stepId === "combat-fusion-select-card" && input.selectedCardId === "fusion-gemgpt") input.queueStepAction("combat-fusion-select-card", "SELECT_FUSION_ENTITY_FOR_ATTACK");
  if (stepId === "combat-fusion-direct-attack" && input.signals.playerDirectDamageCount >= 3) input.queueStepAction("combat-fusion-direct-attack", "PLAYER_FUSION_DIRECT_ATTACK_DONE");
  if (stepId === "combat-fusion-trap-explained" && input.signals.trapResolutionCount >= 2) input.queueStepAction("combat-fusion-trap-explained", "FUSION_ATTACK_TRAP_TRIGGERED");
  if (stepId === "combat-fusion-pass-turn" && (input.signals.hasOpponentDefenseCard || input.hasOpponentResponseAfterPass || input.hasPlayerTurnReturnedAfterPass)) {
    input.queueStepAction("combat-fusion-pass-turn", "OPPONENT_DEFENSE_READY", 900);
  }
  if (stepId === "combat-select-python" && input.selectedCardId === "entity-python") input.queueStepAction("combat-select-python", "SELECT_PYTHON");
  if (stepId === "combat-summon-python" && input.signals.hasPythonAttackSummon) input.queueStepAction("combat-summon-python", "SUMMON_PYTHON_ATTACK");
  if (stepId === "combat-graveyard-open" && input.isGraveyardOpen) input.queueStepAction("combat-graveyard-open", "OPEN_GRAVEYARD");
  if (stepId === "combat-graveyard-close" && !input.isGraveyardOpen) input.queueStepAction("combat-graveyard-close", "CLOSE_GRAVEYARD");
  if (stepId === "combat-python-battle-phase" && input.phase === "BATTLE") input.queueStepAction("combat-python-battle-phase", "TURN_TO_BATTLE_PYTHON");
  if (stepId === "combat-fusion-defense-attack" && input.signals.hasFusionAttackAgainstDefense) input.queueStepAction("combat-fusion-defense-attack", "FUSION_ATTACK_DEFENSE_DONE");
  if (stepId === "combat-python-direct-attack-final" && input.signals.hasPythonDirectAttack) input.queueStepAction("combat-python-direct-attack-final", "PYTHON_DIRECT_ATTACK_DONE");
  if (stepId === "combat-win-confirmed" && input.hasWinner) input.queueStepAction("combat-win-confirmed", "MATCH_WON");
}

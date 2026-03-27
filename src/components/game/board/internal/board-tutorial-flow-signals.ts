// src/components/game/board/internal/board-tutorial-flow-signals.ts - Centraliza señales derivadas del combatLog para el overlay del tutorial de combate.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import {
  countOpponentCardPlayed,
  countPlayerDirectDamage,
  countTrapResolutions,
  countTurnStartedByActor,
  hasCardPlayed,
  hasEvent,
  hasOpponentCardPlayedInMode,
  hasOpponentTurnStarted,
  hasPlayerBattlePhase,
  hasPlayerBattleResolvedAgainstEntity,
  hasPlayerDirectAttackByCard,
  hasTrapResolution,
} from "@/components/game/board/internal/board-tutorial-flow-events";

export interface IBoardTutorialFlowSignals {
  hasFusionSummon: boolean;
  hasChatgptAttackSummon: boolean;
  hasGeminiAttackSummon: boolean;
  hasBoostActivated: boolean;
  hasTutorialTrapSet: boolean;
  hasEnergyRestoreActivated: boolean;
  hasFusionMagicSelected: boolean;
  hasOpponentSetCard: boolean;
  hasOpponentDefenseCard: boolean;
  opponentCardPlayedCount: number;
  hasPythonAttackSummon: boolean;
  hasOpponentTurn: boolean;
  hasPlayerToBattle: boolean;
  hasFusionAttackAgainstDefense: boolean;
  hasPythonDirectAttack: boolean;
  playerDirectDamageCount: number;
  playerTurnStartedCount: number;
  trapResolutionCount: number;
  hasTrapDefenseResolved: boolean;
}

interface IResolveBoardTutorialFlowSignalsInput {
  combatLog: ICombatLogEvent[];
  selectedCardId: string | null;
}

/**
 * Convierte el estado bruto del combate en señales semánticas para transición de pasos tutoriales.
 */
export function resolveBoardTutorialFlowSignals(input: IResolveBoardTutorialFlowSignalsInput): IBoardTutorialFlowSignals {
  return {
    hasFusionSummon: hasEvent(input.combatLog, "FUSION_SUMMONED"),
    hasChatgptAttackSummon: hasCardPlayed(input.combatLog, "entity-chatgpt", "ATTACK"),
    hasGeminiAttackSummon: hasCardPlayed(input.combatLog, "entity-gemini", "ATTACK"),
    hasBoostActivated: hasCardPlayed(input.combatLog, "exec-boost-atk-400", "ACTIVATE"),
    hasTutorialTrapSet: hasCardPlayed(input.combatLog, "tutorial-trap-attack-drain-200", "SET"),
    hasEnergyRestoreActivated: hasCardPlayed(input.combatLog, "tutorial-exec-energy-restore", "ACTIVATE"),
    hasFusionMagicSelected: input.selectedCardId === "exec-fusion-gemgpt",
    hasOpponentSetCard: hasCardPlayed(input.combatLog, "tutorial-opp-shock-trap", "SET"),
    hasOpponentDefenseCard: hasOpponentCardPlayedInMode(input.combatLog, "DEFENSE"),
    opponentCardPlayedCount: countOpponentCardPlayed(input.combatLog),
    hasPythonAttackSummon: hasCardPlayed(input.combatLog, "entity-python", "ATTACK"),
    hasOpponentTurn: hasOpponentTurnStarted(input.combatLog),
    hasPlayerToBattle: hasPlayerBattlePhase(input.combatLog),
    hasFusionAttackAgainstDefense: hasPlayerBattleResolvedAgainstEntity(input.combatLog, "fusion-gemgpt"),
    hasPythonDirectAttack: hasPlayerDirectAttackByCard(input.combatLog, "entity-python"),
    playerDirectDamageCount: countPlayerDirectDamage(input.combatLog),
    playerTurnStartedCount: countTurnStartedByActor(input.combatLog, "player-local"),
    trapResolutionCount: countTrapResolutions(input.combatLog),
    hasTrapDefenseResolved: hasTrapResolution(input.combatLog),
  };
}

export function isBoardTutorialExecutionShowcaseStep(stepId: string | undefined, isFusionCinematicActive: boolean): boolean {
  return (
    stepId === "combat-activate-boost" ||
    stepId === "combat-activate-energy-restore" ||
    stepId === "combat-opponent-trap-resolution" ||
    stepId === "combat-fusion-summon-animation" ||
    isFusionCinematicActive
  );
}

export function isBoardTutorialDirectAttackGuidedStep(stepId: string | undefined): boolean {
  return (
    stepId === "combat-direct-attack-guide" ||
    stepId === "combat-direct-attack-chatgpt" ||
    stepId === "combat-direct-attack-gemini-select" ||
    stepId === "combat-direct-attack-gemini" ||
    stepId === "combat-fusion-select-card" ||
    stepId === "combat-fusion-direct-attack" ||
    stepId === "combat-fusion-defense-attack" ||
    stepId === "combat-python-direct-attack-final"
  );
}

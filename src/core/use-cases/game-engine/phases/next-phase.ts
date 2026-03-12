// src/core/use-cases/game-engine/phases/next-phase.ts - Gestiona transición de fases y arranque de turno con recuperación de energía y pasivas mastery.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { drawTopDeckCard } from "@/core/use-cases/game-engine/state/player-utils";
import { createDiscardForHandLimitPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function resetEntitiesForNewTurn(entities: IBoardEntity[]): IBoardEntity[] {
  return entities.map((entity) => ({
    ...entity,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  }));
}

function resolveTurnStartForPlayer(player: IPlayer, playerId: string): { player: IPlayer; pendingTurnAction: GameState["pendingTurnAction"] } {
  if (player.hand.length >= 5) {
    return {
      player,
      pendingTurnAction: createDiscardForHandLimitPendingAction(playerId),
    };
  }

  return {
    player: drawTopDeckCard(player),
    pendingTurnAction: null,
  };
}

function resolveMasteryDefenseEnergyBonus(player: IPlayer): number {
  const hasDefensiveMasteryEntity = player.activeEntities.some(
    (entity) => entity.mode === "DEFENSE" && entity.card.masteryPassiveSkillId === "passive-defense-energy-plus-1",
  );
  return hasDefensiveMasteryEntity ? 1 : 0;
}

export function nextPhase(state: GameState): GameState {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de avanzar.");
  }

  if (state.phase === "MAIN_1") {
    return appendCombatLogEvent(
      {
      ...state,
      phase: "BATTLE",
      },
      state.activePlayerId,
      "PHASE_CHANGED",
      { toPhase: "BATTLE" },
    );
  }

  if (state.phase === "BATTLE") {
    const nextActivePlayerId = state.activePlayerId === state.playerA.id ? state.playerB.id : state.playerA.id;
    const isNextPlayerA = nextActivePlayerId === state.playerA.id;
    const nextActivePlayerBeforeGain = isNextPlayerA ? state.playerA : state.playerB;
    const masteryEnergyBonus = resolveMasteryDefenseEnergyBonus(nextActivePlayerBeforeGain);
    const turnEnergyGain = 2 + masteryEnergyBonus;
    const previousEnergy = isNextPlayerA ? state.playerA.currentEnergy : state.playerB.currentEnergy;
    const nextPlayerA = {
      ...state.playerA,
      currentEnergy: isNextPlayerA ? Math.min(state.playerA.maxEnergy, state.playerA.currentEnergy + turnEnergyGain) : state.playerA.currentEnergy,
      activeEntities: resetEntitiesForNewTurn(state.playerA.activeEntities),
    };
    const nextPlayerB = {
      ...state.playerB,
      currentEnergy: isNextPlayerA ? state.playerB.currentEnergy : Math.min(state.playerB.maxEnergy, state.playerB.currentEnergy + turnEnergyGain),
      activeEntities: resetEntitiesForNewTurn(state.playerB.activeEntities),
    };
    const turnStartResolution = isNextPlayerA
      ? resolveTurnStartForPlayer(nextPlayerA, nextActivePlayerId)
      : resolveTurnStartForPlayer(nextPlayerB, nextActivePlayerId);

    const nextState: GameState = {
      ...state,
      turn: state.turn + 1,
      phase: "MAIN_1",
      activePlayerId: nextActivePlayerId,
      hasNormalSummonedThisTurn: false,
      pendingTurnAction: turnStartResolution.pendingTurnAction,
      playerA: isNextPlayerA ? turnStartResolution.player : nextPlayerA,
      playerB: isNextPlayerA ? nextPlayerB : turnStartResolution.player,
    };

    const energyAfterGain = isNextPlayerA ? nextState.playerA.currentEnergy : nextState.playerB.currentEnergy;
    const withTurnLog = appendCombatLogEvent(nextState, nextActivePlayerId, "TURN_STARTED", {
      activePlayerId: nextActivePlayerId,
      phase: "MAIN_1",
    });
    return appendCombatLogEvent(withTurnLog, nextActivePlayerId, "ENERGY_GAINED", {
      before: previousEnergy,
      gained: Math.max(0, energyAfterGain - previousEnergy),
      after: energyAfterGain,
      masteryDefenseBonus: masteryEnergyBonus,
    });
  }

  return state;
}

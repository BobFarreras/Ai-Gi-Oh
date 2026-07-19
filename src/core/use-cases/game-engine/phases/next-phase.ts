// src/core/use-cases/game-engine/phases/next-phase.ts - Gestiona transición de fases y arranque de turno con recuperación de energía y pasivas mastery.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { drawTopDeckCard } from "@/core/use-cases/game-engine/state/player-utils";
import { createDiscardForHandLimitPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { applyMasteryTurnStart } from "@/core/use-cases/game-engine/phases/internal/mastery-turn-start";
import { applyScheduledRevivals } from "@/core/use-cases/game-engine/phases/internal/apply-scheduled-revivals";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { applyStatusEffectsAtTurnStart, tickStatusEffectsOnTurnEnd } from "@/core/use-cases/game-engine/state/status-effects";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function resetEntitiesForNewTurn(entities: IBoardEntity[], decrementLocks: boolean): IBoardEntity[] {
  return entities.map((entity) => ({
    ...entity,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
    // El bloqueo se descuenta al terminar el turno de su dueño: así "N turnos" son N turnos reales del rival.
    lockedTurnsRemaining: decrementLocks && entity.lockedTurnsRemaining
      ? Math.max(0, entity.lockedTurnsRemaining - 1)
      : entity.lockedTurnsRemaining,
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

interface IMasteryEnergyBonusBreakdown {
  defenseBonus: number;
  attackBonus: number;
}

function resolveMasteryEnergyBonus(player: IPlayer): IMasteryEnergyBonusBreakdown {
  const hasDefensiveMasteryEntity = player.activeEntities.some(
    (entity) => entity.mode === "DEFENSE" && entity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.DEFENSE_ENERGY,
  );
  const hasAttackMasteryEntity = player.activeEntities.some(
    (entity) => entity.mode === "ATTACK" && entity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.ATTACK_ENERGY,
  );
  return {
    defenseBonus: hasDefensiveMasteryEntity ? 1 : 0,
    attackBonus: hasAttackMasteryEntity ? 1 : 0,
  };
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
    const masteryEnergyBonus = resolveMasteryEnergyBonus(nextActivePlayerBeforeGain);
    const totalMasteryBonus = masteryEnergyBonus.defenseBonus + masteryEnergyBonus.attackBonus;
    // Sobrecarga Energética (ficha 1): energía acumulada por combates ganados en turnos anteriores; se
    // concede ahora (al arrancar el turno de su dueño) y se limpia después.
    const pendingEnergyBonus = state.pendingEnergyBonusByPlayerId?.[nextActivePlayerId] ?? 0;
    const totalTurnStartBonus = totalMasteryBonus + pendingEnergyBonus;
    const turnEnergyGain = 2 + totalTurnStartBonus;
    // Arranque en Frío (ficha 8): +energía one-time en el PRIMER turno del jugador, POR ENCIMA del tope (se suma
    // tras el clamp). Solo para el no-starter; al starter se le aplica en la inicialización del tablero.
    const firstTurnEnergyBonus = state.firstTurnEnergyBonusByPlayerId?.[nextActivePlayerId] ?? 0;
    const previousEnergy = isNextPlayerA ? state.playerA.currentEnergy : state.playerB.currentEnergy;
    const nextPlayerA = {
      ...state.playerA,
      currentEnergy: isNextPlayerA ? Math.min(state.playerA.maxEnergy, state.playerA.currentEnergy + turnEnergyGain) + firstTurnEnergyBonus : state.playerA.currentEnergy,
      // El jugador cuyo turno termina (el saliente) descuenta los bloqueos de sus entities.
      activeEntities: resetEntitiesForNewTurn(state.playerA.activeEntities, !isNextPlayerA),
    };
    const nextPlayerB = {
      ...state.playerB,
      currentEnergy: isNextPlayerA ? state.playerB.currentEnergy : Math.min(state.playerB.maxEnergy, state.playerB.currentEnergy + turnEnergyGain) + firstTurnEnergyBonus,
      activeEntities: resetEntitiesForNewTurn(state.playerB.activeEntities, isNextPlayerA),
    };
    // Aprendizaje Continuo / Regeneración: efectos de pasiva mastery sobre el jugador que arranca turno.
    const masteryTurnStart = applyMasteryTurnStart(isNextPlayerA ? nextPlayerA : nextPlayerB);
    // Reactivación (Antigrabity): revive del cementerio al arrancar el turno de su dueño.
    const revival = applyScheduledRevivals(masteryTurnStart.player, state.idFactory);
    // Estados multi-turno: descuenta y purga los del jugador saliente antes de aplicar los del entrante.
    const tickedStatusEffects = tickStatusEffectsOnTurnEnd(state.activeStatusEffects, state.activePlayerId);
    // Daño/curación por turno (Bandera Windows / Abrazo Hugging): se aplican al jugador que arranca turno.
    const statusTurnStart = applyStatusEffectsAtTurnStart(tickedStatusEffects, nextActivePlayerId, revival.player.healthPoints, revival.player.maxHealthPoints);
    const turnStartResolution = resolveTurnStartForPlayer({ ...revival.player, healthPoints: statusTurnStart.healthPoints }, nextActivePlayerId);

    const nextState: GameState = {
      ...state,
      turn: state.turn + 1,
      phase: "MAIN_1",
      activePlayerId: nextActivePlayerId,
      hasNormalSummonedThisTurn: false,
      extraSummonsThisTurn: 0,
      activeStatusEffects: tickedStatusEffects,
      pendingTurnAction: turnStartResolution.pendingTurnAction,
      playerA: isNextPlayerA ? turnStartResolution.player : nextPlayerA,
      playerB: isNextPlayerA ? nextPlayerB : turnStartResolution.player,
      // Sobrecarga Energética: ya concedida arriba; se limpia el pendiente del jugador que arranca turno.
      pendingEnergyBonusByPlayerId: pendingEnergyBonus > 0
        ? { ...state.pendingEnergyBonusByPlayerId, [nextActivePlayerId]: 0 }
        : state.pendingEnergyBonusByPlayerId,
      // Arranque en Frío: one-time, se limpia tras concederlo en el primer turno del jugador.
      firstTurnEnergyBonusByPlayerId: firstTurnEnergyBonus > 0
        ? { ...state.firstTurnEnergyBonusByPlayerId, [nextActivePlayerId]: 0 }
        : state.firstTurnEnergyBonusByPlayerId,
    };

    const energyAfterGain = isNextPlayerA ? nextState.playerA.currentEnergy : nextState.playerB.currentEnergy;
    const withTurnLog = appendCombatLogEvent(nextState, nextActivePlayerId, "TURN_STARTED", {
      activePlayerId: nextActivePlayerId,
      phase: "MAIN_1",
    });
    // Núcleo Defensivo / Turbo Ofensivo: el pulse "+energía" del HUD solo se dispara con el bonus mastery
    // (campo `amount`); el +2 rutinario del turno no debe animarse cada vez.
    let withEnergyLog = appendCombatLogEvent(withTurnLog, nextActivePlayerId, "ENERGY_GAINED", {
      before: previousEnergy,
      gained: Math.max(0, energyAfterGain - previousEnergy),
      after: energyAfterGain,
      masteryDefenseBonus: masteryEnergyBonus.defenseBonus,
      masteryAttackBonus: masteryEnergyBonus.attackBonus,
      ...(pendingEnergyBonus > 0 ? { battleWinEnergyBonus: pendingEnergyBonus } : {}),
      ...(totalTurnStartBonus > 0 ? { amount: totalTurnStartBonus } : {}),
    });
    // Regeneración: cura de inicio de turno → VFX de curación en el HUD del jugador activo.
    if (masteryTurnStart.healAmount > 0) {
      withEnergyLog = appendCombatLogEvent(withEnergyLog, nextActivePlayerId, "HEAL_APPLIED", {
        targetPlayerId: nextActivePlayerId,
        amount: masteryTurnStart.healAmount,
        source: "MASTERY_PASSIVE_HEAL_ON_TURN",
      });
    }
    // Aprendizaje Continuo: buff de ATK por turno → VFX flotante "+ATK" sobre las entities que crecen.
    if (masteryTurnStart.attackGrowths.length > 0) {
      withEnergyLog = appendCombatLogEvent(withEnergyLog, nextActivePlayerId, "STAT_BUFF_APPLIED", {
        stat: "ATTACK",
        amount: masteryTurnStart.attackGrowths[0].step,
        targetEntityIds: masteryTurnStart.attackGrowths.map((growth) => growth.instanceId),
        reason: "MASTERY_PASSIVE_ATK_GROWTH",
      });
    }
    // Reactivación (Antigrabity): eventos de revive (incluye el auto-sacrificio si el campo estaba lleno).
    for (const event of revival.events) {
      withEnergyLog = appendCombatLogEvent(withEnergyLog, nextActivePlayerId, event.eventType, event.payload);
    }
    // Bandera Windows: daño por turno → VFX de daño directo en el HUD del jugador afectado.
    if (statusTurnStart.damageApplied > 0) {
      withEnergyLog = appendCombatLogEvent(withEnergyLog, nextActivePlayerId, "DIRECT_DAMAGE", {
        targetPlayerId: nextActivePlayerId,
        amount: statusTurnStart.damageApplied,
        source: "STATUS_DAMAGE_OVER_TIME",
      });
    }
    // Abrazo Hugging: curación por turno → VFX de curación en el HUD del jugador afectado.
    if (statusTurnStart.healApplied > 0) {
      withEnergyLog = appendCombatLogEvent(withEnergyLog, nextActivePlayerId, "HEAL_APPLIED", {
        targetPlayerId: nextActivePlayerId,
        amount: statusTurnStart.healApplied,
        source: "STATUS_HEAL_OVER_TIME",
      });
    }
    return withEnergyLog;
  }

  return state;
}

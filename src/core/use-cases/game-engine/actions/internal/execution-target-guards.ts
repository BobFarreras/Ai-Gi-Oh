// src/core/use-cases/game-engine/actions/internal/execution-target-guards.ts - Detecta efectos EXECUTION estándar cuyo objetivo de tablero no existe todavía, para suspender la carta en vez de malgastarla.
import { ICardEffect } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";

/**
 * ¿Un efecto EXECUTION estándar (los que resuelve el registry) requiere un objetivo de tablero que
 * ahora mismo NO existe? Si es así, activarlo no haría nada y la carta se desperdiciaría; el llamador
 * la deja en SET para reactivarla en un turno posterior (misma idea que la fusión sin materiales).
 *
 * Sólo cubre efectos con objetivo claro. Los que siempre resuelven aunque su efecto sea 0
 * (DAMAGE, HEAL, DRAW_CARD, RESTORE_ENERGY, DRAIN_OPPONENT_ENERGY, SET_CARD_DUEL_PROGRESS) devuelven
 * false para no cambiar su semántica. Se mantiene alineado con `canActivateExecutionNow` de la IA, de
 * modo que la IA nunca activa algo que aquí se suspendería (sin riesgo de bucle de reactivación).
 */
export function executionStandardEffectHasUnmetTarget(effect: ICardEffect, player: IPlayer, opponent: IPlayer): boolean {
  switch (effect.action) {
    case "BOOST_ATTACK_ALLIED_ENTITY":
      return player.activeEntities.length === 0;
    case "BOOST_DEFENSE_BY_ARCHETYPE":
    case "BOOST_ATTACK_BY_ARCHETYPE":
      return !player.activeEntities.some((entity) => entity.card.archetype === effect.archetype);
    case "SET_DEFENSE_BY_CARD_ID":
    case "BOOST_DEFENSE_BY_CARD_ID":
      return !player.activeEntities.some((entity) => entity.card.id === effect.targetCardId);
    case "REDUCE_OPPONENT_ATTACK":
    case "REDUCE_OPPONENT_DEFENSE":
      return opponent.activeEntities.length === 0;
    case "DESTROY_ALL_TRAPS":
      return !opponent.activeExecutions.some((entity) => entity.card.type === "TRAP");
    case "DISCARD_OPPONENT_HAND_CARD":
      return opponent.hand.length === 0;
    default:
      return false;
  }
}

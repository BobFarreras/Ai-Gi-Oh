// src/core/use-cases/game-engine/combat/internal/attack-logging.ts - Registra eventos de combate y envío de cartas a cementerio/destrucción.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { resolveEnergyRefundOnDeath, resolveEntityAttackBonus } from "@/core/use-cases/game-engine/combat/internal/attack-passives";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface ICombatResultSummary {
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  damageToDefenderPlayer: number;
  damageToAttackerPlayer: number;
  passiveAttackReduction?: number;
  reflectDamageToAttackerPlayer?: number;
  attackerDestroyedDestination?: "GRAVEYARD" | "DESTROYED" | null;
  defenderDestroyedDestination?: "GRAVEYARD" | "DESTROYED" | null;
}

interface IBuildBattleLogsParams {
  state: GameState;
  attackerPlayerId: string;
  attacker: IBoardEntity;
  defender: IBoardEntity;
  result: ICombatResultSummary;
  defenderPlayerId: string;
  attackerPlayerTargetId: string;
}

export function appendDirectAttackLogs(
  state: GameState,
  attackerPlayerId: string,
  attacker: IBoardEntity,
  defenderPlayerId: string,
  damage: number,
): GameState {
  const withAttack = appendCombatLogEvent(state, attackerPlayerId, "ATTACK_DECLARED", {
    attackerInstanceId: attacker.instanceId,
    attackerCardId: attacker.card.id,
    target: "DIRECT",
  });
  const withDamage = appendCombatLogEvent(withAttack, attackerPlayerId, "DIRECT_DAMAGE", {
    targetPlayerId: defenderPlayerId,
    amount: damage,
  });
  return appendCombatLogEvent(withDamage, attackerPlayerId, "BATTLE_RESOLVED", {
    attackerCardId: attacker.card.id,
    defenderCardId: null,
    attackerDestroyed: false,
    defenderDestroyed: false,
    damageToDefenderPlayer: damage,
    damageToAttackerPlayer: 0,
  });
}

export function appendEntityBattleLogs(params: IBuildBattleLogsParams): GameState {
  const { state, attackerPlayerId, attacker, defender, result, defenderPlayerId, attackerPlayerTargetId } = params;
  let withLogs = appendCombatLogEvent(state, attackerPlayerId, "ATTACK_DECLARED", {
    attackerInstanceId: attacker.instanceId,
    attackerCardId: attacker.card.id,
    defenderInstanceId: defender.instanceId,
    defenderCardId: defender.card.id,
  });
  withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "BATTLE_RESOLVED", {
    attackerCardId: attacker.card.id,
    defenderCardId: defender.card.id,
    attackerDestroyed: result.attackerDestroyed,
    defenderDestroyed: result.defenderDestroyed,
    damageToDefenderPlayer: result.damageToDefenderPlayer,
    damageToAttackerPlayer: result.damageToAttackerPlayer,
  });
  if (result.damageToDefenderPlayer > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: defenderPlayerId,
      amount: result.damageToDefenderPlayer,
    });
  }
  if (result.damageToAttackerPlayer > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: attackerPlayerTargetId,
      amount: result.damageToAttackerPlayer,
    });
  }
  // Cortafuegos Reactivo: el daño reflejado se emite como daño directo de efecto con la carta defensora
  // como origen (source), para que dispare el rayo de daño directo desde el Cortafuegos hacia el atacante.
  if ((result.reflectDamageToAttackerPlayer ?? 0) > 0) {
    withLogs = appendCombatLogEvent(withLogs, defenderPlayerId, "DIRECT_DAMAGE", {
      targetPlayerId: attackerPlayerTargetId,
      amount: result.reflectDamageToAttackerPlayer,
      sourceCardId: defender.card.id,
      sourceLaneType: "ENTITIES",
      reason: "MASTERY_PASSIVE_REFLECT_DAMAGE",
    });
  }
  if ((result.passiveAttackReduction ?? 0) > 0) {
    withLogs = appendCombatLogEvent(withLogs, defenderPlayerId, "STAT_BUFF_APPLIED", {
      stat: "ATTACK",
      amount: -Math.abs(result.passiveAttackReduction ?? 0),
      targetEntityIds: [attacker.instanceId],
      reason: "MASTERY_PASSIVE_ATK_DRAIN",
    });
  }
  // Sobrecarga (mastery): bonus efímero de ATK del atacante al embestir a una entity rival. No se
  // persiste en la carta; se emite el buff para mostrar el "+ATK" flotante durante ese ataque.
  const entityAttackBonus = resolveEntityAttackBonus(attacker);
  if (entityAttackBonus > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "STAT_BUFF_APPLIED", {
      stat: "ATTACK",
      amount: entityAttackBonus,
      targetEntityIds: [attacker.instanceId],
      reason: "MASTERY_PASSIVE_ENTITY_ATTACK_BONUS",
    });
  }
  if (result.attackerDestroyed) {
    const eventType = result.attackerDestroyedDestination === "DESTROYED" ? "CARD_TO_DESTROYED" : "CARD_TO_GRAVEYARD";
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, eventType, {
      cardId: attacker.card.id,
      ownerPlayerId: attackerPlayerTargetId,
      from: "BATTLEFIELD",
    });
  }
  if (result.defenderDestroyed) {
    const eventType = result.defenderDestroyedDestination === "DESTROYED" ? "CARD_TO_DESTROYED" : "CARD_TO_GRAVEYARD";
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, eventType, {
      cardId: defender.card.id,
      ownerPlayerId: defenderPlayerId,
      from: "BATTLEFIELD",
    });
  }
  // Autoguardado (mastery): la entity destruida devuelve energía a su dueño. El motor ya la suma en
  // attack-player-updates; aquí solo se emite el evento para que el HUD dispare el VFX de "+energía".
  const attackerEnergyRefund = result.attackerDestroyed ? resolveEnergyRefundOnDeath(attacker) : 0;
  if (attackerEnergyRefund > 0) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerTargetId, "ENERGY_GAINED", {
      amount: attackerEnergyRefund,
      source: "MASTERY_PASSIVE_ENERGY_ON_DEATH",
      sourceCardId: attacker.card.id,
    });
  }
  const defenderEnergyRefund = result.defenderDestroyed ? resolveEnergyRefundOnDeath(defender) : 0;
  if (defenderEnergyRefund > 0) {
    withLogs = appendCombatLogEvent(withLogs, defenderPlayerId, "ENERGY_GAINED", {
      amount: defenderEnergyRefund,
      source: "MASTERY_PASSIVE_ENERGY_ON_DEATH",
      sourceCardId: defender.card.id,
    });
  }
  return withLogs;
}

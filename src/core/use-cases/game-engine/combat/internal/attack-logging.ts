import { IBoardEntity } from "@/core/entities/IPlayer";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface ICombatResultSummary {
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  damageToDefenderPlayer: number;
  damageToAttackerPlayer: number;
  passiveAttackReduction?: number;
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
  if ((result.passiveAttackReduction ?? 0) > 0) {
    withLogs = appendCombatLogEvent(withLogs, defenderPlayerId, "STAT_BUFF_APPLIED", {
      stat: "ATTACK",
      amount: -Math.abs(result.passiveAttackReduction ?? 0),
      targetEntityIds: [attacker.instanceId],
      reason: "MASTERY_PASSIVE_ATK_DRAIN",
    });
  }
  if (result.attackerDestroyed) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "CARD_TO_GRAVEYARD", {
      cardId: attacker.card.id,
      ownerPlayerId: attackerPlayerTargetId,
      from: "BATTLEFIELD",
    });
  }
  if (result.defenderDestroyed) {
    withLogs = appendCombatLogEvent(withLogs, attackerPlayerId, "CARD_TO_GRAVEYARD", {
      cardId: defender.card.id,
      ownerPlayerId: defenderPlayerId,
      from: "BATTLEFIELD",
    });
  }
  return withLogs;
}

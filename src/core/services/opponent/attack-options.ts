// src/core/services/opponent/attack-options.ts - Genera y puntúa opciones de ataque para evaluación heurística del bot.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { CombatService } from "@/core/use-cases/CombatService";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";

export interface IAttackOption {
  attacker: IBoardEntity;
  defender?: IBoardEntity;
  score: number;
  isLethal: boolean;
  isHighValueClear: boolean;
  isLosingTrade: boolean;
  defenderDestroyed: boolean;
  attackerDestroyed: boolean;
  damageToAttackerPlayer: number;
}

function getEntityBattleStat(entity: IBoardEntity): number {
  return entity.mode === "DEFENSE" || entity.mode === "SET" ? (entity.card.defense ?? 0) : (entity.card.attack ?? 0);
}

function entityValue(entity: IBoardEntity): number {
  return (entity.card.attack ?? 0) * 1.2 + (entity.card.defense ?? 0);
}

function scoreDirectAttack(attackerAtk: number, targetPlayer: IPlayer, profile: IOpponentDifficultyProfile): number {
  const lethalChance = attackerAtk >= targetPlayer.healthPoints ? profile.lethalBias : 0;
  const expectedDamage = attackerAtk + profile.directAttackBias;
  const boardAdvantage = Math.floor(attackerAtk * 0.12);
  return expectedDamage + boardAdvantage + lethalChance;
}

function scoreBattle(attacker: IBoardEntity, defender: IBoardEntity, targetPlayer: IPlayer, profile: IOpponentDifficultyProfile): IAttackOption {
  const attackerAtk = attacker.card.attack ?? 0;
  const defenderStat = getEntityBattleStat(defender);
  const isDefenderInDefenseMode = defender.mode === "DEFENSE" || defender.mode === "SET";
  const result = CombatService.calculateBattle({ attackerAtk, defenderStat, isDefenderInDefenseMode });
  const expectedDamage = result.damageToDefenderPlayer;
  const boardAdvantage = (result.defenderDestroyed ? profile.destroyReward : 0) + (result.defenderDestroyed ? Math.floor(entityValue(defender) * 0.2) : 0);
  const lethalChance = expectedDamage >= targetPlayer.healthPoints ? profile.lethalBias : 0;
  const selfDamageRisk = result.damageToAttackerPlayer * profile.selfDamagePenaltyMultiplier;
  const attackerValueLoss = result.attackerDestroyed ? profile.attackerLossPenalty + Math.floor(entityValue(attacker) * 0.2) : 0;
  const score = expectedDamage + boardAdvantage + lethalChance - selfDamageRisk - attackerValueLoss;
  const isHighValueClear = result.defenderDestroyed && entityValue(defender) >= entityValue(attacker) * 1.5 && (defender.card.attack ?? 0) >= 2200;
  const isLosingTrade = result.attackerDestroyed && !result.defenderDestroyed;
  return { attacker, defender, score, isLethal: lethalChance > 0, isHighValueClear, isLosingTrade, defenderDestroyed: result.defenderDestroyed, attackerDestroyed: result.attackerDestroyed, damageToAttackerPlayer: result.damageToAttackerPlayer };
}

export function buildAttackOptions(opponent: IPlayer, target: IPlayer, profile: IOpponentDifficultyProfile): IAttackOption[] {
  const attackers = opponent.activeEntities.filter((entity) => entity.mode === "ATTACK" && !entity.hasAttackedThisTurn && !entity.isNewlySummoned);
  if (attackers.length === 0) return [];
  if (target.activeEntities.length === 0) {
    return attackers.map((attacker) => ({
      attacker,
      score: scoreDirectAttack(attacker.card.attack ?? 0, target, profile),
      isLethal: (attacker.card.attack ?? 0) >= target.healthPoints,
      isHighValueClear: false,
      isLosingTrade: false,
      defenderDestroyed: false,
      attackerDestroyed: false,
      damageToAttackerPlayer: 0,
    }));
  }
  return attackers.flatMap((attacker) => target.activeEntities.map((defender) => scoreBattle(attacker, defender, target, profile)));
}

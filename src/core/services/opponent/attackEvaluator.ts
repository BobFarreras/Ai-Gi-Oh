import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { CombatService } from "@/core/use-cases/CombatService";
import { IOpponentDifficultyProfile } from "./difficulty/types";

interface IAttackOption {
  attacker: IBoardEntity;
  defender?: IBoardEntity;
  score: number;
}

function getEntityBattleStat(entity: IBoardEntity): number {
  if (entity.mode === "DEFENSE" || entity.mode === "SET") {
    return entity.card.defense ?? 0;
  }

  return entity.card.attack ?? 0;
}

function scoreDirectAttack(attackerAtk: number, targetPlayer: IPlayer, profile: IOpponentDifficultyProfile): number {
  const wouldBeLethal = attackerAtk >= targetPlayer.healthPoints;
  const pressureBonus = Math.floor(attackerAtk * 0.12);

  return attackerAtk + pressureBonus + profile.directAttackBias + (wouldBeLethal ? profile.lethalBias : 0);
}

function scoreBattle(attacker: IBoardEntity, defender: IBoardEntity, profile: IOpponentDifficultyProfile): number {
  const attackerAtk = attacker.card.attack ?? 0;
  const defenderStat = getEntityBattleStat(defender);
  const isDefenderInDefenseMode = defender.mode === "DEFENSE" || defender.mode === "SET";
  const result = CombatService.calculateBattle({ attackerAtk, defenderStat, isDefenderInDefenseMode });

  const destroyScore =
    (result.defenderDestroyed ? profile.destroyReward : 0) - (result.attackerDestroyed ? profile.attackerLossPenalty : 0);
  const damageScore = result.damageToDefenderPlayer * 1.1 - result.damageToAttackerPlayer * profile.selfDamagePenaltyMultiplier;
  const statBias = (attacker.card.attack ?? 0) * 0.06 - defenderStat * 0.03;

  return destroyScore + damageScore + statBias;
}

function buildAttackOptions(opponent: IPlayer, target: IPlayer, profile: IOpponentDifficultyProfile): IAttackOption[] {
  const attackers = opponent.activeEntities.filter(
    (entity) => entity.mode === "ATTACK" && !entity.hasAttackedThisTurn && !entity.isNewlySummoned,
  );

  if (attackers.length === 0) {
    return [];
  }

  if (target.activeEntities.length === 0) {
    return attackers.map((attacker) => ({
      attacker,
      score: scoreDirectAttack(attacker.card.attack ?? 0, target, profile),
    }));
  }

  return attackers.flatMap((attacker) =>
    target.activeEntities.map((defender) => ({
      attacker,
      defender,
      score: scoreBattle(attacker, defender, profile),
    })),
  );
}

export function chooseBestAttack(
  opponent: IPlayer,
  target: IPlayer,
  profile: IOpponentDifficultyProfile,
): { attackerInstanceId: string; defenderInstanceId?: string } | null {
  const options = buildAttackOptions(opponent, target, profile);

  if (options.length === 0) {
    return null;
  }

  const bestOption = options.reduce((best, current) => (current.score > best.score ? current : best));
  if (bestOption.score < profile.minAttackScore) {
    return null;
  }

  if (bestOption.defender) {
    return {
      attackerInstanceId: bestOption.attacker.instanceId,
      defenderInstanceId: bestOption.defender.instanceId,
    };
  }

  return {
    attackerInstanceId: bestOption.attacker.instanceId,
  };
}

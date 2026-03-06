import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { CombatService } from "@/core/use-cases/CombatService";
import { IOpponentDifficultyProfile } from "./difficulty/types";

interface IAttackOption {
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
  if (entity.mode === "DEFENSE" || entity.mode === "SET") {
    return entity.card.defense ?? 0;
  }

  return entity.card.attack ?? 0;
}

function scoreDirectAttack(attackerAtk: number, targetPlayer: IPlayer, profile: IOpponentDifficultyProfile): number {
  const lethalChance = attackerAtk >= targetPlayer.healthPoints ? profile.lethalBias : 0;
  const expectedDamage = attackerAtk + profile.directAttackBias;
  const boardAdvantage = Math.floor(attackerAtk * 0.12);
  return expectedDamage + boardAdvantage + lethalChance;
}

function entityValue(entity: IBoardEntity): number {
  return (entity.card.attack ?? 0) * 1.2 + (entity.card.defense ?? 0);
}

function scoreBattle(
  attacker: IBoardEntity,
  defender: IBoardEntity,
  targetPlayer: IPlayer,
  profile: IOpponentDifficultyProfile,
): IAttackOption {
  const attackerAtk = attacker.card.attack ?? 0;
  const defenderStat = getEntityBattleStat(defender);
  const isDefenderInDefenseMode = defender.mode === "DEFENSE" || defender.mode === "SET";
  const result = CombatService.calculateBattle({ attackerAtk, defenderStat, isDefenderInDefenseMode });
  const expectedDamage = result.damageToDefenderPlayer;
  const boardAdvantage =
    (result.defenderDestroyed ? profile.destroyReward : 0) +
    (result.defenderDestroyed ? Math.floor(entityValue(defender) * 0.2) : 0);
  const lethalChance = expectedDamage >= targetPlayer.healthPoints ? profile.lethalBias : 0;
  const selfDamageRisk = result.damageToAttackerPlayer * profile.selfDamagePenaltyMultiplier;
  const attackerValueLoss = result.attackerDestroyed ? profile.attackerLossPenalty + Math.floor(entityValue(attacker) * 0.2) : 0;
  const score = expectedDamage + boardAdvantage + lethalChance - selfDamageRisk - attackerValueLoss;
  const isHighValueClear =
    result.defenderDestroyed &&
    entityValue(defender) >= entityValue(attacker) * 1.5 &&
    (defender.card.attack ?? 0) >= 2200;
  const isLosingTrade = result.attackerDestroyed && !result.defenderDestroyed;

  return {
    attacker,
    defender,
    score,
    isLethal: lethalChance > 0,
    isHighValueClear,
    isLosingTrade,
    defenderDestroyed: result.defenderDestroyed,
    attackerDestroyed: result.attackerDestroyed,
    damageToAttackerPlayer: result.damageToAttackerPlayer,
  };
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
      isLethal: (attacker.card.attack ?? 0) >= target.healthPoints,
      isHighValueClear: false,
      isLosingTrade: false,
      defenderDestroyed: false,
      attackerDestroyed: false,
      damageToAttackerPlayer: 0,
    }));
  }

  return attackers.flatMap((attacker) =>
    target.activeEntities.map((defender) => scoreBattle(attacker, defender, target, profile)),
  );
}

function isSuicidalAttack(option: IAttackOption): boolean {
  return option.attackerDestroyed && !option.defenderDestroyed && option.damageToAttackerPlayer > 0;
}

function filterOptionsByRisk(
  options: IAttackOption[],
  profile: IOpponentDifficultyProfile,
): IAttackOption[] {
  if (profile.key === "EASY") {
    return options;
  }

  return options.filter((option) => {
    if (option.isLethal || option.isHighValueClear) {
      return true;
    }

    if (isSuicidalAttack(option)) {
      return false;
    }

    if (profile.key === "NORMAL") {
      return option.damageToAttackerPlayer <= 900;
    }

    return option.damageToAttackerPlayer <= 250 && !option.isLosingTrade;
  });
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

  const filteredOptions = filterOptionsByRisk(options, profile);
  if (filteredOptions.length === 0) {
    return null;
  }

  const bestOption = filteredOptions.reduce((best, current) => (current.score > best.score ? current : best));
  if (bestOption.isLosingTrade && !bestOption.isLethal) {
    return null;
  }

  if (bestOption.score < profile.minAttackScore && !bestOption.isLethal && !bestOption.isHighValueClear) {
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

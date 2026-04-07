// src/core/services/opponent/attackEvaluator.ts - Selecciona el mejor ataque viable para el bot con filtros por riesgo/dificultad.
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentDifficultyProfile } from "./difficulty/types";
import { buildAttackOptions } from "@/core/services/opponent/attack-options";
import { filterOptionsByRisk } from "@/core/services/opponent/attack-risk-filter";
import { IAttackOption } from "@/core/services/opponent/attack-options";

function isProbePressureOption(option: IAttackOption, profile: IOpponentDifficultyProfile): boolean {
  if (!option.defender) return false;
  if (option.defender.mode !== "SET") return false;
  if (option.isLethal || option.isHighValueClear) return true;
  if (option.attackerDestroyed && !option.defenderDestroyed) return false;
  const maxProbeDamage = Math.trunc(900 + profile.destroyReward * 0.25);
  return option.damageToAttackerPlayer <= maxProbeDamage;
}

function pickPressureFallback(options: IAttackOption[], profile: IOpponentDifficultyProfile): IAttackOption | null {
  const probeOptions = options.filter((option) => isProbePressureOption(option, profile));
  if (probeOptions.length === 0) return null;
  return probeOptions.reduce((best, current) => (current.score > best.score ? current : best));
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
    const fallbackOption = pickPressureFallback(options, profile);
    if (!fallbackOption) return null;
    return fallbackOption.defender
      ? { attackerInstanceId: fallbackOption.attacker.instanceId, defenderInstanceId: fallbackOption.defender.instanceId }
      : { attackerInstanceId: fallbackOption.attacker.instanceId };
  }

  const bestOption = filteredOptions.reduce((best, current) => (current.score > best.score ? current : best));
  const allowPressureAttack = isProbePressureOption(bestOption, profile);
  if (bestOption.isLosingTrade && !bestOption.isLethal && !allowPressureAttack) {
    return null;
  }

  if (bestOption.score < profile.minAttackScore && !bestOption.isLethal && !bestOption.isHighValueClear && !allowPressureAttack) {
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

// src/core/services/opponent/attackEvaluator.ts - Selecciona el mejor ataque viable para el bot con filtros por riesgo/dificultad.
import { IPlayer } from "@/core/entities/IPlayer";
import { IOpponentDifficultyProfile } from "./difficulty/types";
import { buildAttackOptions } from "@/core/services/opponent/attack-options";
import { filterOptionsByRisk } from "@/core/services/opponent/attack-risk-filter";

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

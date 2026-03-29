// src/core/services/opponent/attack-risk-filter.ts - Filtra opciones de ataque por perfil de riesgo según dificultad del bot.
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IAttackOption } from "@/core/services/opponent/attack-options";

function isSuicidalAttack(option: IAttackOption): boolean {
  return option.attackerDestroyed && !option.defenderDestroyed && option.damageToAttackerPlayer > 0;
}

export function filterOptionsByRisk(options: IAttackOption[], profile: IOpponentDifficultyProfile): IAttackOption[] {
  if (profile.key === "EASY") {
    return options.filter((option) => {
      if (option.isLethal || option.isHighValueClear) return true;
      if (option.isLosingTrade) return false;
      return option.damageToAttackerPlayer <= 700;
    });
  }
  return options.filter((option) => {
    if (option.isLethal || option.isHighValueClear) return true;
    if (isSuicidalAttack(option)) return false;
    if (profile.key === "NORMAL") return option.damageToAttackerPlayer <= 900;
    return option.damageToAttackerPlayer <= 250 && !option.isLosingTrade;
  });
}

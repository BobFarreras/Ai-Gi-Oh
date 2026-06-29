// src/core/services/progression/mastery-passive-display.ts - Traduce identificadores de pasiva mastery a textos legibles en UI.
import { MASTERY_PASSIVE_IDS } from "./mastery-passive-ids";

const PASSIVE_LABEL_BY_ID: Record<string, string> = {
  [MASTERY_PASSIVE_IDS.ATK_DRAIN]: "Drenaje de ATK: al ser atacada, reduce 200 ATK del atacante.",
  [MASTERY_PASSIVE_IDS.DEFENSE_ENERGY]: "Núcleo Defensivo: en defensa, gana +1 energía al inicio del turno.",
  [MASTERY_PASSIVE_IDS.ATTACK_ENERGY]: "Turbo Ofensivo: en ataque, gana +1 energía al inicio del turno.",
  [MASTERY_PASSIVE_IDS.DIRECT_HIT]: "Carga Letal: los golpes directos infligen +200 daño.",
  [MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON]: "Caja de Herramientas: al invocarse, su dueño roba 1 carta.",
  [MASTERY_PASSIVE_IDS.ATK_GROWTH]: "Aprendizaje Continuo: +100 ATK al inicio de cada turno propio (hasta +500).",
  [MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH]: "Autoguardado: al ser destruida, devuelve 1 energía a su dueño.",
  [MASTERY_PASSIVE_IDS.REFLECT_DAMAGE]: "Cortafuegos Reactivo: al ser atacada, refleja 200 de daño al rival.",
  [MASTERY_PASSIVE_IDS.HEAL_ON_TURN]: "Regeneración: al inicio de cada turno propio, el dueño cura 200 HP.",
  [MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS]: "Sobrecarga: al atacar a una entity rival, gana +300 ATK en ese ataque.",
};

export function resolveMasteryPassiveLabel(passiveSkillId: string | null): string | null {
  if (!passiveSkillId) return null;
  return PASSIVE_LABEL_BY_ID[passiveSkillId] ?? "Pasiva Mastery activa en esta carta.";
}

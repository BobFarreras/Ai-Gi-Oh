// src/core/services/progression/mastery-passive-magnitude.ts - Magnitud de cada pasiva mastery escalada por versión (fuente única editable). Innata = valor reducido pre-V5; pleno en V5.
import { ENERGY_ON_BATTLE_WIN_PASSIVE_ID, MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";

interface IMagnitudeByTier {
  /** Valor cuando la pasiva es innata y la carta aún no es V5. */
  base: number;
  /** Valor pleno al alcanzar V5 (o para cartas cuya pasiva solo existe en V5). */
  v5: number;
}

/** Catálogo de magnitudes editable: ajustar aquí cambia el balance sin tocar los handlers. */
const PASSIVE_MAGNITUDE: Record<string, IMagnitudeByTier> = {
  [MASTERY_PASSIVE_IDS.ATK_DRAIN]: { base: 100, v5: 200 },
  [MASTERY_PASSIVE_IDS.DIRECT_HIT]: { base: 100, v5: 200 },
  [MASTERY_PASSIVE_IDS.REFLECT_DAMAGE]: { base: 100, v5: 200 },
  [MASTERY_PASSIVE_IDS.HEAL_ON_TURN]: { base: 100, v5: 200 },
  [MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS]: { base: 150, v5: 300 },
  [MASTERY_PASSIVE_IDS.ATK_GROWTH]: { base: 50, v5: 100 },
  // Pasivas "binarias": no tiene sentido escalarlas por debajo de 1.
  [MASTERY_PASSIVE_IDS.DEFENSE_ENERGY]: { base: 1, v5: 1 },
  [MASTERY_PASSIVE_IDS.ATTACK_ENERGY]: { base: 1, v5: 1 },
  [MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH]: { base: 1, v5: 1 },
  [MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON]: { base: 1, v5: 1 },
  // Sobrecarga Energética (innata de Windows 92, ficha 1 v1.17): +1 por combate ganado; +2 al llegar a V5.
  [ENERGY_ON_BATTLE_WIN_PASSIVE_ID]: { base: 1, v5: 2 },
};

/** Múltiplo del paso para calcular el tope acumulado del crecimiento de ATK (Aprendizaje). */
const ATK_GROWTH_CAP_MULTIPLIER = 5;

/** Devuelve la magnitud efectiva de una pasiva según la versión de la carta (V5+ = pleno). */
export function resolvePassiveMagnitude(passiveSkillId: string | null | undefined, versionTier: number | undefined): number {
  if (!passiveSkillId) return 0;
  const magnitude = PASSIVE_MAGNITUDE[passiveSkillId];
  if (!magnitude) return 0;
  return (versionTier ?? 0) >= 5 ? magnitude.v5 : magnitude.base;
}

/** Tope acumulado del crecimiento de ATK, proporcional a la magnitud por turno. */
export function resolveAttackGrowthCap(versionTier: number | undefined): number {
  return resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.ATK_GROWTH, versionTier) * ATK_GROWTH_CAP_MULTIPLIER;
}

// src/core/services/progression/mastery-passive-display.ts - Traduce identificadores de pasiva mastery a textos legibles en UI, con magnitud escalada por versión.
import { MASTERY_PASSIVE_IDS, NEXUS_ON_BATTLE_WIN_PASSIVE_ID, NEXUS_PER_BATTLE_WIN, REVIVE_NEXT_TURN_PASSIVE_ID } from "./mastery-passive-ids";
import { resolvePassiveMagnitude } from "./mastery-passive-magnitude";

/** Plantillas de texto: reciben la magnitud ya escalada para reflejar el valor real de la carta. */
const PASSIVE_TEMPLATE: Record<string, (magnitude: number) => string> = {
  [MASTERY_PASSIVE_IDS.ATK_DRAIN]: (m) => `Drenaje de ATK: al ser atacada, reduce ${m} ATK del atacante.`,
  [MASTERY_PASSIVE_IDS.DEFENSE_ENERGY]: () => "Núcleo Defensivo: en defensa, gana +1 energía al inicio del turno.",
  [MASTERY_PASSIVE_IDS.ATTACK_ENERGY]: () => "Turbo Ofensivo: en ataque, gana +1 energía al inicio del turno.",
  [MASTERY_PASSIVE_IDS.DIRECT_HIT]: (m) => `Carga Letal: los golpes directos infligen +${m} daño.`,
  [MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON]: () => "Caja de Herramientas: al invocarse, su dueño roba 1 carta.",
  [MASTERY_PASSIVE_IDS.ATK_GROWTH]: (m) => `Aprendizaje Continuo: +${m} ATK al inicio de cada turno propio (hasta +${m * 5}).`,
  [MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH]: () => "Autoguardado: al ser destruida, devuelve 1 energía a su dueño.",
  [MASTERY_PASSIVE_IDS.REFLECT_DAMAGE]: (m) => `Cortafuegos Reactivo: al ser atacada, refleja ${m} de daño al rival.`,
  [MASTERY_PASSIVE_IDS.HEAL_ON_TURN]: (m) => `Regeneración: al inicio de cada turno propio, el dueño cura ${m} HP.`,
  [MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS]: (m) => `Sobrecarga: al atacar a una entity rival, gana +${m} ATK en ese ataque.`,
  [REVIVE_NEXT_TURN_PASSIVE_ID]: () => "Reactivación: al ir al cementerio, revive en tu siguiente turno (si el campo está lleno, sacrifica una entity).",
  [NEXUS_ON_BATTLE_WIN_PASSIVE_ID]: () => `Recaudación: al ganar un combate a una entity rival, ganas ${NEXUS_PER_BATTLE_WIN} Nexus (solo en Story y Arena, con tope diario).`,
};

/**
 * Devuelve el texto de la pasiva con la magnitud correspondiente a la versión.
 * Sin `versionTier` asume el valor pleno (V5), útil para glosarios/referencia.
 * Devuelve `null` cuando no hay pasiva o no sabemos describir su efecto: preferimos
 * ocultar la línea antes que afirmar un poder vacío ("Pasiva activa" sin explicar).
 */
export function resolveMasteryPassiveLabel(passiveSkillId: string | null, versionTier?: number): string | null {
  if (!passiveSkillId) return null;
  const template = PASSIVE_TEMPLATE[passiveSkillId];
  if (!template) return null;
  return template(resolvePassiveMagnitude(passiveSkillId, versionTier ?? 5));
}

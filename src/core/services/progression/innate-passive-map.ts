// src/core/services/progression/innate-passive-map.ts - Fuente única en código de las pasivas innatas por carta (para el catálogo en código: oponentes de training/arena/tutoriales). Debe coincidir con la migración 079 / cards_catalog.innate_passive_skill_id.
import { ENERGY_ON_BATTLE_WIN_PASSIVE_ID, MASTERY_PASSIVE_IDS, NEXUS_ON_BATTLE_WIN_PASSIVE_ID, REVIVE_NEXT_TURN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";

/**
 * Mapa cardId → pasiva innata (activa desde V0). Espejo en código de la columna
 * `cards_catalog.innate_passive_skill_id`, para que las cartas cargadas desde el
 * catálogo en código (oponentes de training/arena, tutoriales) apliquen el poder
 * igual que las cargadas desde la BD (usuario, multijugador, story).
 */
export const INNATE_PASSIVE_SKILL_BY_CARD_ID: Record<string, string> = {
  "entity-vscode": MASTERY_PASSIVE_IDS.REFLECT_DAMAGE,
  "entity-cursor": MASTERY_PASSIVE_IDS.ATK_GROWTH,
  "entity-git": MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON,
  "entity-copilot": MASTERY_PASSIVE_IDS.ATK_GROWTH,
  "entity-huggenface": MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS,
  "entity-n8n": MASTERY_PASSIVE_IDS.ATK_DRAIN,
  "entity-vercel": MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS,
  "entity-astro": MASTERY_PASSIVE_IDS.DIRECT_HIT,
  "entity-perplexity": MASTERY_PASSIVE_IDS.HEAL_ON_TURN,
  "entity-make": MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH,
  "entity-antigrabity": REVIVE_NEXT_TURN_PASSIVE_ID,
  "entity-recaudador": NEXUS_ON_BATTLE_WIN_PASSIVE_ID,
  // Windows 92 (ficha 1 v1.17): Sobrecarga Energética innata; a V5 sube a +2 (sustituye a la pasiva TOOL
  // de arquetipo, ver migración 133 — misma decisión "sin doble poder" que la 079).
  "entity-windows92": ENERGY_ON_BATTLE_WIN_PASSIVE_ID,
};

/** Devuelve la pasiva innata de una carta, o null si no tiene. */
export function resolveInnatePassiveSkillId(cardId: string): string | null {
  return INNATE_PASSIVE_SKILL_BY_CARD_ID[cardId] ?? null;
}

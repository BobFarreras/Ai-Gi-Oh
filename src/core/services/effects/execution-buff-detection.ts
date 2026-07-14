// src/core/services/effects/execution-buff-detection.ts - Predice si una magia aplica un buff positivo a
// las entities del jugador. Lo usa la UI para prever qué trampas reactivas de buff (OpenClaw) pueden saltar,
// en sintonía con el motor (que dispara ON_OPPONENT_STAT_BUFF_APPLIED solo cuando hay buff con valor > 0).
import { ICardEffect } from "@/core/entities/ICard";

const POSITIVE_BUFF_ACTIONS: ReadonlySet<ICardEffect["action"]> = new Set([
  "BOOST_ATTACK_ALLIED_ENTITY",
  "BOOST_DEFENSE_BY_ARCHETYPE",
  "BOOST_ATTACK_BY_ARCHETYPE",
  "SET_DEFENSE_BY_CARD_ID",
  "BOOST_DEFENSE_BY_CARD_ID",
  "BOOST_ATTACK_BY_CARD_ID",
]);

/** ¿Este efecto de ejecución aplica un buff positivo a entities aliadas? */
export function executionEffectAppliesBuff(effect: ICardEffect | undefined): boolean {
  return effect !== undefined && POSITIVE_BUFF_ACTIONS.has(effect.action);
}

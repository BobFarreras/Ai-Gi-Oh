// src/core/services/progression/skill-tree/resolve-opponent-combat-modifiers.ts - Resolver PURO de los
// modificadores de combate de un oponente. Reutiliza el resolver del jugador (una sola fuente de agregación) y
// expone SOLO las stats aplicables a un rival: LP inicial, techo de energía y energía de turno 1. Los efectos
// de mano/rebarajar/editar-mazo, economía y permisos se ignoran a propósito (v1: la IA solo recibe stats).
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { IPlayerSkillNodeState, SKILL_EFFECT_KINDS, SkillEffectKind } from "./skill-effect-types";
import { resolvePlayerSkillModifiers } from "./resolve-player-skill-modifiers";

/**
 * Efectos de STATS de combate aplicables a un oponente (v1). El resto de efectos de combate
 * (mano/rebarajar/editar-mazo), economía y permisos NO se asignan a rivales.
 */
export const OPPONENT_COMBAT_STAT_KINDS: ReadonlySet<SkillEffectKind> = new Set([
  SKILL_EFFECT_KINDS.STARTING_LP_BONUS,
  SKILL_EFFECT_KINDS.MAX_ENERGY_BONUS,
  SKILL_EFFECT_KINDS.TURN1_ENERGY_BONUS,
]);

/** Nodo del catálogo presentable en el editor de habilidades de oponente (solo stats de combate). */
export interface IOpponentSkillNodeOption {
  id: string;
  name: string;
  blurb: string;
  kind: SkillEffectKind;
  maxRank: number;
  /** Bonus por rango (LP o energía). Para TURN1 (keystone) es su valor fijo con maxRank 1. */
  perRank: number;
  unit: "LP" | "ENERGY";
}

/** Filtra el catálogo activo a los nodos de stats de la rama COMBATE y los mapea a opciones para el editor
 * admin. Excluir la ROOT (`node-core`) evita un segundo "+LP" confuso: dejamos un nodo por stat. */
export function listOpponentCombatSkillNodes(catalog: readonly ISkillTreeNode[]): IOpponentSkillNodeOption[] {
  return catalog
    .filter((node) => node.branch === "COMBAT" && OPPONENT_COMBAT_STAT_KINDS.has(node.effect.kind))
    .map((node) => {
      const effect = node.effect;
      const perRank =
        effect.kind === "STARTING_LP_BONUS" || effect.kind === "MAX_ENERGY_BONUS"
          ? effect.valuePerRank
          : effect.kind === "TURN1_ENERGY_BONUS"
            ? effect.value
            : 0;
      return {
        id: node.id,
        name: node.display.name,
        blurb: node.display.blurb,
        kind: effect.kind,
        maxRank: node.maxRank,
        perRank,
        unit: effect.kind === "STARTING_LP_BONUS" ? ("LP" as const) : ("ENERGY" as const),
      };
    });
}

/** Modificadores de combate de un oponente (subconjunto de stats de los del jugador). */
export interface IOpponentCombatModifiers {
  startingLpBonus: number;
  maxEnergyBonus: number;
  turn1EnergyBonus: number;
}

export const EMPTY_OPPONENT_COMBAT_MODIFIERS: IOpponentCombatModifiers = {
  startingLpBonus: 0,
  maxEnergyBonus: 0,
  turn1EnergyBonus: 0,
};

/**
 * Agrega los nodos asignados a un oponente y devuelve solo sus stats de combate. Al reutilizar
 * `resolvePlayerSkillModifiers`, hereda la compat hacia delante (kinds desconocidos ignorados) y el saneo de
 * rangos (< 1 se descarta). Se recorta a >= 0 por si un catálogo futuro trae valores negativos.
 */
export function resolveOpponentCombatModifiers(nodes: readonly IPlayerSkillNodeState[]): IOpponentCombatModifiers {
  const { combat } = resolvePlayerSkillModifiers(nodes);
  return {
    startingLpBonus: Math.max(0, combat.startingLpBonus),
    maxEnergyBonus: Math.max(0, combat.maxEnergyBonus),
    turn1EnergyBonus: Math.max(0, combat.turn1EnergyBonus),
  };
}

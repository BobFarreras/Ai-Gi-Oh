// src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.ts - Convierte filas de cards_catalog en entidades ICard del dominio.
import {
  IBoostAttackAlliedEffect,
  IBoostAttackByArchetypeEffect,
  IBoostDefenseByArchetypeEffect,
  ICard,
  ICardEffect,
  IDamageEffect,
  IDestroyEntityOnBattleWinEffect,
  IDrawCardEffect,
  IFusionSummonEffect,
  IHealEffect,
  INegateOpponentTrapAndDestroyEffect,
  INegateAttackAndDestroyAttackerEffect,
  IReturnGraveyardCardToFieldEffect,
  IReturnGraveyardCardToHandEffect,
  IReduceOpponentAttackEffect,
  IReduceOpponentDefenseEffect,
} from "@/core/entities/ICard";
import { ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapEffect(value: unknown): ICardEffect | undefined {
  if (!isRecord(value) || typeof value.action !== "string") return undefined;
  switch (value.action) {
    case "DAMAGE":
      return typeof value.target === "string" && typeof value.value === "number"
        ? ({ action: "DAMAGE", target: value.target, value: value.value } as IDamageEffect)
        : undefined;
    case "HEAL":
      return typeof value.target === "string" && typeof value.value === "number"
        ? ({ action: "HEAL", target: value.target, value: value.value } as IHealEffect)
        : undefined;
    case "DRAW_CARD":
      return typeof value.cards === "number" ? ({ action: "DRAW_CARD", cards: value.cards } as IDrawCardEffect) : undefined;
    case "BOOST_ATTACK_ALLIED_ENTITY":
      return typeof value.value === "number"
        ? ({ action: "BOOST_ATTACK_ALLIED_ENTITY", value: value.value } as IBoostAttackAlliedEffect)
        : undefined;
    case "BOOST_DEFENSE_BY_ARCHETYPE":
      return typeof value.archetype === "string" && typeof value.value === "number"
        ? ({ action: "BOOST_DEFENSE_BY_ARCHETYPE", archetype: value.archetype, value: value.value } as IBoostDefenseByArchetypeEffect)
        : undefined;
    case "BOOST_ATTACK_BY_ARCHETYPE":
      return typeof value.archetype === "string" && typeof value.value === "number"
        ? ({ action: "BOOST_ATTACK_BY_ARCHETYPE", archetype: value.archetype, value: value.value } as IBoostAttackByArchetypeEffect)
        : undefined;
    case "REDUCE_OPPONENT_ATTACK":
      return typeof value.value === "number"
        ? ({ action: "REDUCE_OPPONENT_ATTACK", value: value.value } as IReduceOpponentAttackEffect)
        : undefined;
    case "REDUCE_OPPONENT_DEFENSE":
      return typeof value.value === "number"
        ? ({ action: "REDUCE_OPPONENT_DEFENSE", value: value.value } as IReduceOpponentDefenseEffect)
        : undefined;
    case "NEGATE_ATTACK_AND_DESTROY_ATTACKER":
      return { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" } as INegateAttackAndDestroyAttackerEffect;
    case "RETURN_GRAVEYARD_CARD_TO_HAND":
      return { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: typeof value.cardType === "string" ? value.cardType : undefined } as IReturnGraveyardCardToHandEffect;
    case "RETURN_GRAVEYARD_CARD_TO_FIELD":
      return { action: "RETURN_GRAVEYARD_CARD_TO_FIELD", cardType: typeof value.cardType === "string" ? value.cardType : undefined } as IReturnGraveyardCardToFieldEffect;
    case "DESTROY_ENTITY_ON_BATTLE_WIN":
      return { action: "DESTROY_ENTITY_ON_BATTLE_WIN" } as IDestroyEntityOnBattleWinEffect;
    case "NEGATE_OPPONENT_TRAP_AND_DESTROY":
      return { action: "NEGATE_OPPONENT_TRAP_AND_DESTROY" } as INegateOpponentTrapAndDestroyEffect;
    case "FUSION_SUMMON":
      return typeof value.recipeId === "string" && typeof value.materialsRequired === "number"
        ? ({ action: "FUSION_SUMMON", recipeId: value.recipeId, materialsRequired: value.materialsRequired } as IFusionSummonEffect)
        : undefined;
    default:
      return undefined;
  }
}

export function mapCardCatalogRowToCard(row: ICardCatalogRow): ICard {
  const effect = mapEffect(row.effect);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    faction: row.faction,
    cost: row.cost,
    attack: row.attack ?? undefined,
    defense: row.defense ?? undefined,
    archetype: row.archetype ?? undefined,
    trigger: row.trigger ?? undefined,
    bgUrl: row.bg_url ?? undefined,
    renderUrl: row.render_url ?? undefined,
    effect,
    fusionRecipeId: row.fusion_recipe_id ?? undefined,
    fusionMaterials: row.fusion_material_ids.length > 0 ? row.fusion_material_ids : undefined,
    fusionEnergyRequirement: row.fusion_energy_requirement ?? undefined,
  };
}

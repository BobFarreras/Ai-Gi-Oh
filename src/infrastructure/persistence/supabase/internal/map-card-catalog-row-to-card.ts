// src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.ts - Convierte filas de cards_catalog en entidades ICard del dominio.
import {
  IBoostAttackAlliedEffect,
  IBoostAttackByArchetypeEffect,
  IBoostDefenseByArchetypeEffect,
  ICard,
  ICardEffect,
  ICopyOpponentBuffToAlliedEntitiesEffect,
  INullifyOpponentBuffEffect,
  IDamageEffect,
  IDestroyAllTrapsEffect,
  IDiscardOpponentHandCardEffect,
  ILockOpponentEntityEffect,
  IRestoreEnergyEffect,
  IDirectAttackEnergyDrainAndSetSelfToTenEffect,
  IDrainOpponentEnergyEffect,
  IDestroyEntityOnBattleWinEffect,
  IDrawCardEffect,
  IForceSummonedDefenseToAttackLockedEffect,
  IFusionSummonEffect,
  IHealEffect,
  INegateOpponentTrapAndDestroyEffect,
  INegateAttackAndDestroyAttackerEffect,
  INegateAttackEffect,
  IRevealOpponentSetCardEffect,
  IReturnGraveyardCardToFieldEffect,
  IReturnGraveyardCardToHandEffect,
  IReduceOpponentAttackEffect,
  IReduceOpponentDefenseEffect,
  ISetCardDuelProgressEffect,
  IBoostDefenseByCardIdEffect,
  IBoostAttackByCardIdEffect,
  IDamageIfAllyOnBoardEffect,
  IApplyNoDirectAttacksEffect,
  IAllowDefenseModeAttackEffect,
  IApplyDamageOverTimeEffect,
  IApplyHealOverTimeEffect,
  IReflectDirectDamageEffect,
  IGrantExtraSummonEffect,
  IDestroyOpponentEntityEffect,
  IFlipOpponentEntityToDefenseEffect,
  ISacrificeAllyEntityForEnergyEffect,
  ISwapHandsEffect,
  ISwapBoardEntitiesEffect,
  IStealOpponentEntityEffect,
  IStealOpponentExecutionEffect,
  INegateOpponentExecutionAndDestroyEffect,
  IReinforceLinkedEntityOnAttackEffect,
  ISetDefenseByCardIdEffect,
  IStealOpponentGraveyardCardToHandEffect,
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
    case "RESTORE_ENERGY":
      return { action: "RESTORE_ENERGY", value: typeof value.value === "number" ? value.value : undefined } as IRestoreEnergyEffect;
    case "DESTROY_ALL_TRAPS":
      return { action: "DESTROY_ALL_TRAPS" } as IDestroyAllTrapsEffect;
    case "DISCARD_OPPONENT_HAND_CARD":
      return { action: "DISCARD_OPPONENT_HAND_CARD", count: typeof value.count === "number" ? value.count : undefined } as IDiscardOpponentHandCardEffect;
    case "LOCK_OPPONENT_ENTITY":
      return typeof value.turns === "number" ? ({ action: "LOCK_OPPONENT_ENTITY", turns: value.turns } as ILockOpponentEntityEffect) : undefined;
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
    case "SET_DEFENSE_BY_CARD_ID":
      return typeof value.targetCardId === "string" && typeof value.value === "number"
        ? ({ action: "SET_DEFENSE_BY_CARD_ID", targetCardId: value.targetCardId, value: value.value } as ISetDefenseByCardIdEffect)
        : undefined;
    case "BOOST_DEFENSE_BY_CARD_ID":
      return typeof value.targetCardId === "string" && typeof value.value === "number"
        ? ({ action: "BOOST_DEFENSE_BY_CARD_ID", targetCardId: value.targetCardId, value: value.value } as IBoostDefenseByCardIdEffect)
        : undefined;
    case "BOOST_ATTACK_BY_CARD_ID":
      return typeof value.targetCardId === "string" && typeof value.value === "number"
        ? ({ action: "BOOST_ATTACK_BY_CARD_ID", targetCardId: value.targetCardId, value: value.value } as IBoostAttackByCardIdEffect)
        : undefined;
    case "DAMAGE_IF_ALLY_ON_BOARD":
      return typeof value.requiredCardId === "string" && typeof value.value === "number"
        ? ({ action: "DAMAGE_IF_ALLY_ON_BOARD", requiredCardId: value.requiredCardId, value: value.value } as IDamageIfAllyOnBoardEffect)
        : undefined;
    case "APPLY_NO_DIRECT_ATTACKS":
      return typeof value.turns === "number"
        ? ({ action: "APPLY_NO_DIRECT_ATTACKS", turns: value.turns } as IApplyNoDirectAttacksEffect)
        : undefined;
    case "ALLOW_DEFENSE_MODE_ATTACK":
      return { action: "ALLOW_DEFENSE_MODE_ATTACK" } as IAllowDefenseModeAttackEffect;
    case "APPLY_DAMAGE_OVER_TIME":
      return typeof value.value === "number"
        ? ({ action: "APPLY_DAMAGE_OVER_TIME", value: value.value, turns: typeof value.turns === "number" ? value.turns : null } as IApplyDamageOverTimeEffect)
        : undefined;
    case "APPLY_HEAL_OVER_TIME":
      return typeof value.value === "number"
        ? ({ action: "APPLY_HEAL_OVER_TIME", value: value.value, turns: typeof value.turns === "number" ? value.turns : null } as IApplyHealOverTimeEffect)
        : undefined;
    case "DESTROY_OPPONENT_ENTITY":
      return { action: "DESTROY_OPPONENT_ENTITY" } as IDestroyOpponentEntityEffect;
    case "FLIP_OPPONENT_ENTITY_TO_DEFENSE":
      return { action: "FLIP_OPPONENT_ENTITY_TO_DEFENSE" } as IFlipOpponentEntityToDefenseEffect;
    case "SACRIFICE_ALLY_ENTITY_FOR_ENERGY":
      return { action: "SACRIFICE_ALLY_ENTITY_FOR_ENERGY" } as ISacrificeAllyEntityForEnergyEffect;
    case "SWAP_HANDS":
      return { action: "SWAP_HANDS" } as ISwapHandsEffect;
    case "SWAP_BOARD_ENTITIES":
      return { action: "SWAP_BOARD_ENTITIES" } as ISwapBoardEntitiesEffect;
    case "STEAL_OPPONENT_ENTITY":
      return { action: "STEAL_OPPONENT_ENTITY" } as IStealOpponentEntityEffect;
    case "STEAL_OPPONENT_EXECUTION":
      return { action: "STEAL_OPPONENT_EXECUTION" } as IStealOpponentExecutionEffect;
    case "NEGATE_OPPONENT_EXECUTION_AND_DESTROY":
      return { action: "NEGATE_OPPONENT_EXECUTION_AND_DESTROY" } as INegateOpponentExecutionAndDestroyEffect;
    case "REINFORCE_LINKED_ENTITY_ON_ATTACK":
      return typeof value.linkedCardId === "string" && typeof value.value === "number"
        ? ({ action: "REINFORCE_LINKED_ENTITY_ON_ATTACK", linkedCardId: value.linkedCardId, value: value.value } as IReinforceLinkedEntityOnAttackEffect)
        : undefined;
    case "DRAIN_OPPONENT_ENERGY":
      return { action: "DRAIN_OPPONENT_ENERGY" } as IDrainOpponentEnergyEffect;
    case "SET_CARD_DUEL_PROGRESS":
      return typeof value.targetCardId === "string" && typeof value.level === "number" && typeof value.versionTier === "number"
        ? ({ action: "SET_CARD_DUEL_PROGRESS", targetCardId: value.targetCardId, level: value.level, versionTier: value.versionTier } as ISetCardDuelProgressEffect)
        : undefined;
    case "REVEAL_OPPONENT_SET_CARD":
      return { action: "REVEAL_OPPONENT_SET_CARD", zone: typeof value.zone === "string" ? value.zone : undefined } as IRevealOpponentSetCardEffect;
    case "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND":
      return { action: "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND", cardType: typeof value.cardType === "string" ? value.cardType : undefined } as IStealOpponentGraveyardCardToHandEffect;
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
    case "NEGATE_ATTACK":
      return { action: "NEGATE_ATTACK" } as INegateAttackEffect;
    case "REFLECT_DIRECT_DAMAGE":
      return { action: "REFLECT_DIRECT_DAMAGE" } as IReflectDirectDamageEffect;
    case "GRANT_EXTRA_SUMMON":
      return { action: "GRANT_EXTRA_SUMMON", count: typeof value.count === "number" ? value.count : undefined } as IGrantExtraSummonEffect;
    case "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES":
      return { action: "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES" } as ICopyOpponentBuffToAlliedEntitiesEffect;
    case "NULLIFY_OPPONENT_BUFF":
      return { action: "NULLIFY_OPPONENT_BUFF" } as INullifyOpponentBuffEffect;
    case "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED":
      return { action: "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED" } as IForceSummonedDefenseToAttackLockedEffect;
    case "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN":
      return { action: "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN" } as IDirectAttackEnergyDrainAndSetSelfToTenEffect;
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
    maxLevelRenderUrl: row.render_url_max_level ?? undefined,
    effect,
    fusionRecipeId: row.fusion_recipe_id ?? undefined,
    fusionMaterials: row.fusion_material_ids.length > 0 ? row.fusion_material_ids : undefined,
    fusionEnergyRequirement: row.fusion_energy_requirement ?? undefined,
    // Poder innato: la pasiva se transporta desde V1 en la carta base (la progresión la respeta).
    masteryPassiveSkillId: row.innate_passive_skill_id ?? undefined,
  };
}

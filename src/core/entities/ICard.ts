// src/core/entities/ICard.ts - Define contratos de carta base y metadatos runtime para el motor de juego.
// src/core/entities/ICard.ts - Define contratos de carta base, triggers de trampa y efectos de combate/recuperación.
export type CardType = "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
export type Faction = "OPEN_SOURCE" | "BIG_TECH" | "NO_CODE" | "NEUTRAL";
export type CardArchetype = "LLM" | "FRAMEWORK" | "DB" | "IDE" | "LANGUAGE" | "TOOL" | "SECURITY";
export type TrapTrigger = "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED";

export interface IDamageEffect {
  action: "DAMAGE";
  target: "OPPONENT" | "PLAYER";
  value: number;
}

export interface IHealEffect {
  action: "HEAL";
  target: "PLAYER";
  value: number;
}

export interface IDrawCardEffect {
  action: "DRAW_CARD";
  cards: number;
}

export interface IBoostAttackAlliedEffect {
  action: "BOOST_ATTACK_ALLIED_ENTITY";
  value: number;
}

export interface IBoostDefenseByArchetypeEffect {
  action: "BOOST_DEFENSE_BY_ARCHETYPE";
  archetype: CardArchetype;
  value: number;
}

export interface IBoostAttackByArchetypeEffect {
  action: "BOOST_ATTACK_BY_ARCHETYPE";
  archetype: CardArchetype;
  value: number;
}

export interface IReduceOpponentAttackEffect {
  action: "REDUCE_OPPONENT_ATTACK";
  value: number;
}

export interface IReduceOpponentDefenseEffect {
  action: "REDUCE_OPPONENT_DEFENSE";
  value: number;
}

export interface INegateAttackAndDestroyAttackerEffect {
  action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER";
}

export interface IReturnGraveyardCardToHandEffect {
  action: "RETURN_GRAVEYARD_CARD_TO_HAND";
  cardType?: CardType;
}

export interface IReturnGraveyardCardToFieldEffect {
  action: "RETURN_GRAVEYARD_CARD_TO_FIELD";
  cardType?: "ENTITY" | "EXECUTION" | "TRAP";
}

export interface IDestroyEntityOnBattleWinEffect {
  action: "DESTROY_ENTITY_ON_BATTLE_WIN";
}

export interface INegateOpponentTrapAndDestroyEffect {
  action: "NEGATE_OPPONENT_TRAP_AND_DESTROY";
}

export interface IFusionSummonEffect {
  action: "FUSION_SUMMON";
  recipeId: string;
  materialsRequired: number;
}

export type ICardEffect =
  | IDamageEffect
  | IHealEffect
  | IDrawCardEffect
  | IBoostAttackAlliedEffect
  | IBoostDefenseByArchetypeEffect
  | IBoostAttackByArchetypeEffect
  | IReduceOpponentAttackEffect
  | IReduceOpponentDefenseEffect
  | INegateAttackAndDestroyAttackerEffect
  | IReturnGraveyardCardToHandEffect
  | IReturnGraveyardCardToFieldEffect
  | IDestroyEntityOnBattleWinEffect
  | INegateOpponentTrapAndDestroyEffect
  | IFusionSummonEffect;

export interface ICard {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: CardType;
  readonly faction: Faction;
  readonly cost: number;
  readonly attack?: number;
  readonly defense?: number;
  readonly bgUrl?: string;
  readonly renderUrl?: string;
  readonly effect?: ICardEffect;
  readonly fusionRecipeId?: string;
  readonly fusionMaterials?: string[];
  readonly fusionEnergyRequirement?: number;
  readonly archetype?: CardArchetype;
  readonly trigger?: TrapTrigger;
  readonly runtimeId?: string;
  readonly versionTier?: number;
  readonly level?: number;
  readonly xp?: number;
  readonly masteryPassiveSkillId?: string | null;
  readonly masteryPassiveLabel?: string | null;
}

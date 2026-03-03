// src/core/entities/ICard.ts
export type CardType = "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
export type Faction = "OPEN_SOURCE" | "BIG_TECH" | "NO_CODE" | "NEUTRAL";
export type CardArchetype = "LLM" | "FRAMEWORK" | "DB" | "IDE" | "LANGUAGE" | "TOOL" | "SECURITY";

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

export type ICardEffect =
  | IDamageEffect
  | IHealEffect
  | IDrawCardEffect
  | IBoostAttackAlliedEffect
  | IBoostDefenseByArchetypeEffect
  | IBoostAttackByArchetypeEffect;

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
}

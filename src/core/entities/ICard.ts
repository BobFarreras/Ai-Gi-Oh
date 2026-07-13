// src/core/entities/ICard.ts - Define contratos de carta base y metadatos runtime para el motor de juego.
// src/core/entities/ICard.ts - Define contratos de carta base, triggers de trampa y efectos de combate/recuperación.
export type CardType = "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
export type Faction = "OPEN_SOURCE" | "BIG_TECH" | "NO_CODE" | "NEUTRAL";
export type CardArchetype = "LLM" | "FRAMEWORK" | "DB" | "IDE" | "LANGUAGE" | "TOOL" | "SECURITY";
export type TrapTrigger =
  | "ON_OPPONENT_ATTACK_DECLARED"
  | "ON_OPPONENT_EXECUTION_ACTIVATED"
  | "ON_OPPONENT_TRAP_ACTIVATED"
  | "ON_OPPONENT_STAT_BUFF_APPLIED"
  | "ON_OPPONENT_ENTITY_SET_PLAYED"
  | "ON_OPPONENT_DIRECT_ATTACK_DECLARED";

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

export interface IRestoreEnergyEffect {
  action: "RESTORE_ENERGY";
  value?: number;
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

export interface ISetDefenseByCardIdEffect {
  action: "SET_DEFENSE_BY_CARD_ID";
  targetCardId: string;
  value: number;
}

export interface IBoostDefenseByCardIdEffect {
  action: "BOOST_DEFENSE_BY_CARD_ID";
  targetCardId: string;
  value: number;
}

export interface IBoostAttackByCardIdEffect {
  action: "BOOST_ATTACK_BY_CARD_ID";
  targetCardId: string;
  value: number;
}

/** Inflige `value` de daño al rival SOLO si el jugador tiene en campo una entity con `requiredCardId`. */
export interface IDamageIfAllyOnBoardEffect {
  action: "DAMAGE_IF_ALLY_ON_BOARD";
  requiredCardId: string;
  value: number;
}

/** Impide al rival hacer ataques directos durante `turns` turnos suyos (puede seguir atacando entities). */
export interface IApplyNoDirectAttacksEffect {
  action: "APPLY_NO_DIRECT_ATTACKS";
  turns: number;
}

/** El jugador elige una entity rival del tablero y la destruye (a la pila de destruidas). */
export interface IDestroyOpponentEntityEffect {
  action: "DESTROY_OPPONENT_ENTITY";
}

/** El jugador elige una entity rival del tablero y la voltea a modo DEFENSA. */
export interface IFlipOpponentEntityToDefenseEffect {
  action: "FLIP_OPPONENT_ENTITY_TO_DEFENSE";
}

/** El jugador elige una entity PROPIA, la destruye y gana energía igual a su coste. */
export interface ISacrificeAllyEntityForEnergyEffect {
  action: "SACRIFICE_ALLY_ENTITY_FOR_ENERGY";
}

export interface IDrainOpponentEnergyEffect {
  action: "DRAIN_OPPONENT_ENERGY";
}

export interface ISetCardDuelProgressEffect {
  action: "SET_CARD_DUEL_PROGRESS";
  targetCardId: string;
  level: number;
  versionTier: number;
}

export interface IRevealOpponentSetCardEffect {
  action: "REVEAL_OPPONENT_SET_CARD";
  zone?: "ENTITIES" | "EXECUTIONS" | "ANY";
}

export interface IStealOpponentGraveyardCardToHandEffect {
  action: "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND";
  cardType?: CardType;
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

export interface ICopyOpponentBuffToAlliedEntitiesEffect {
  action: "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES";
}

export interface IForceSummonedDefenseToAttackLockedEffect {
  action: "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED";
}

export interface IDirectAttackEnergyDrainAndSetSelfToTenEffect {
  action: "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN";
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

/** Destruye todas las trampas puestas del rival en el tablero. */
export interface IDestroyAllTrapsEffect {
  action: "DESTROY_ALL_TRAPS";
}

/** Descarta cartas de la mano del rival al cementerio (las más antiguas; determinista). */
export interface IDiscardOpponentHandCardEffect {
  action: "DISCARD_OPPONENT_HAND_CARD";
  /** Cuántas cartas descartar (por defecto 1). */
  count?: number;
}

/** Bloquea una entity rival seleccionada (no puede atacar) durante N turnos del rival. */
export interface ILockOpponentEntityEffect {
  action: "LOCK_OPPONENT_ENTITY";
  /** Turnos del rival que la entity queda bloqueada (agnóstico: cada carta pone el suyo). */
  turns: number;
}

export type ICardEffect =
  | IDamageEffect
  | IHealEffect
  | IDrawCardEffect
  | IRestoreEnergyEffect
  | IBoostAttackAlliedEffect
  | IBoostDefenseByArchetypeEffect
  | IBoostAttackByArchetypeEffect
  | ISetDefenseByCardIdEffect
  | IBoostDefenseByCardIdEffect
  | IBoostAttackByCardIdEffect
  | IDamageIfAllyOnBoardEffect
  | IApplyNoDirectAttacksEffect
  | IDestroyOpponentEntityEffect
  | IFlipOpponentEntityToDefenseEffect
  | ISacrificeAllyEntityForEnergyEffect
  | IDrainOpponentEnergyEffect
  | ISetCardDuelProgressEffect
  | IRevealOpponentSetCardEffect
  | IStealOpponentGraveyardCardToHandEffect
  | IReduceOpponentAttackEffect
  | IReduceOpponentDefenseEffect
  | INegateAttackAndDestroyAttackerEffect
  | ICopyOpponentBuffToAlliedEntitiesEffect
  | IForceSummonedDefenseToAttackLockedEffect
  | IDirectAttackEnergyDrainAndSetSelfToTenEffect
  | IReturnGraveyardCardToHandEffect
  | IReturnGraveyardCardToFieldEffect
  | IDestroyEntityOnBattleWinEffect
  | INegateOpponentTrapAndDestroyEffect
  | IFusionSummonEffect
  | IDestroyAllTrapsEffect
  | IDiscardOpponentHandCardEffect
  | ILockOpponentEntityEffect;

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

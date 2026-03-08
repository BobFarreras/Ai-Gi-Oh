// src/core/use-cases/game-engine/combat/internal/attack-resolution.ts - Resuelve estado de combate directo/entre entidades aplicando reglas y pasivas mastery.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { CombatContext, CombatService } from "@/core/use-cases/CombatService";
import { assignPlayers } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";
import { markAttackerAsUsed } from "@/core/use-cases/game-engine/combat/internal/attack-entities";
import { validateDirectAttack } from "@/core/use-cases/game-engine/combat/internal/attack-validation";

interface IResolveDirectAttackParams {
  state: GameState;
  attacker: IPlayer;
  defender: IPlayer;
  attackerEntity: IBoardEntity;
  attackerInstanceId: string;
  isPlayerA: boolean;
}

function resolveDirectHitBonus(attackerEntity: IBoardEntity): number {
  return attackerEntity.card.masteryPassiveSkillId === "passive-direct-hit-plus-200" ? 200 : 0;
}

function applyAttackDrainByDefenderPassive(attackerAttack: number, defenderEntity: IBoardEntity): number {
  if (defenderEntity.card.masteryPassiveSkillId !== "passive-atk-drain-200") return attackerAttack;
  return Math.max(0, attackerAttack - 200);
}

export function resolveDirectAttackState(params: IResolveDirectAttackParams): { state: GameState; damage: number } {
  const { state, attacker, defender, attackerEntity, attackerInstanceId, isPlayerA } = params;
  validateDirectAttack(defender.activeEntities.length > 0);
  const damage = (attackerEntity.card.attack ?? 0) + resolveDirectHitBonus(attackerEntity);
  const updatedAttacker: IPlayer = {
    ...attacker,
    activeEntities: markAttackerAsUsed(attacker.activeEntities, attackerInstanceId),
  };
  const updatedDefender: IPlayer = {
    ...defender,
    healthPoints: Math.max(0, defender.healthPoints - damage),
  };
  return { state: assignPlayers(state, updatedAttacker, updatedDefender, isPlayerA), damage };
}

interface IResolveEntityBattleParams {
  state: GameState;
  attacker: IPlayer;
  defender: IPlayer;
  attackerEntity: IBoardEntity;
  defenderInstanceId: string;
  attackerInstanceId: string;
  isPlayerA: boolean;
}

interface IResolvedEntityBattleResult extends ReturnType<typeof CombatService.calculateBattle> {
  passiveAttackReduction: number;
  attackerDestroyedDestination: "GRAVEYARD" | "DESTROYED" | null;
  defenderDestroyedDestination: "GRAVEYARD" | "DESTROYED" | null;
}

function shouldDestroyBattleTarget(winner: IBoardEntity, winnerDestroyed: boolean, loserDestroyed: boolean): boolean {
  return !winnerDestroyed && loserDestroyed && winner.card.effect?.action === "DESTROY_ENTITY_ON_BATTLE_WIN";
}

export function resolveEntityBattleState(params: IResolveEntityBattleParams): { state: GameState; result: IResolvedEntityBattleResult; defenderEntity: IBoardEntity } {
  const { state, attacker, defender, attackerEntity, defenderInstanceId, attackerInstanceId, isPlayerA } = params;
  const defenderEntity = defender.activeEntities.find((entity) => entity.instanceId === defenderInstanceId);
  if (!defenderEntity) {
    throw new NotFoundError("La carta defensora no está en el campo");
  }

  const isDefenderInDefenseMode = defenderEntity.mode === "DEFENSE" || defenderEntity.mode === "SET";
  const attackerAttackBase = attackerEntity.card.attack ?? 0;
  const attackerAttackAfterPassive = applyAttackDrainByDefenderPassive(attackerAttackBase, defenderEntity);
  const passiveAttackReduction = Math.max(0, attackerAttackBase - attackerAttackAfterPassive);
  const defenderStat = isDefenderInDefenseMode ? (defenderEntity.card.defense ?? 0) : (defenderEntity.card.attack ?? 0);
  const context: CombatContext = {
    attackerAtk: attackerAttackAfterPassive,
    defenderStat,
    isDefenderInDefenseMode,
  };
  const result = CombatService.calculateBattle(context);
  const updatedAttacker = buildUpdatedAttacker(
    attacker,
    attackerEntity,
    defenderEntity,
    attackerInstanceId,
    passiveAttackReduction,
    result.attackerDestroyed,
    result.damageToAttackerPlayer,
    result.defenderDestroyed,
  );
  const updatedDefender = buildUpdatedDefender(
    defender,
    defenderEntity,
    attackerEntity,
    defenderInstanceId,
    result.defenderDestroyed,
    result.damageToDefenderPlayer,
    result.attackerDestroyed,
  );
  return {
    state: assignPlayers(state, updatedAttacker.player, updatedDefender.player, isPlayerA),
    result: {
      ...result,
      passiveAttackReduction,
      attackerDestroyedDestination: updatedAttacker.destroyedDestination,
      defenderDestroyedDestination: updatedDefender.destroyedDestination,
    },
    defenderEntity,
  };
}

function buildUpdatedAttacker(
  attacker: IPlayer,
  attackerEntity: IBoardEntity,
  defenderEntity: IBoardEntity,
  attackerInstanceId: string,
  passiveAttackReduction: number,
  attackerDestroyed: boolean,
  damageToAttackerPlayer: number,
  defenderDestroyed: boolean,
): { player: IPlayer; destroyedDestination: "GRAVEYARD" | "DESTROYED" | null } {
  const entitiesWithPassiveReduction =
    passiveAttackReduction > 0
      ? attacker.activeEntities.map((entity) =>
          entity.instanceId === attackerInstanceId && typeof entity.card.attack === "number"
            ? { ...entity, card: { ...entity.card, attack: Math.max(0, entity.card.attack - passiveAttackReduction) } }
            : entity,
        )
      : attacker.activeEntities;
  let updatedEntities = markAttackerAsUsed(entitiesWithPassiveReduction, attackerInstanceId);
  let updatedGraveyard = attacker.graveyard;
  let updatedDestroyedPile = [...(attacker.destroyedPile ?? [])];
  let destroyedDestination: "GRAVEYARD" | "DESTROYED" | null = null;
  if (attackerDestroyed) {
    updatedEntities = updatedEntities.filter((entity) => entity.instanceId !== attackerInstanceId);
    if (shouldDestroyBattleTarget(defenderEntity, defenderDestroyed, attackerDestroyed)) {
      updatedDestroyedPile = [...updatedDestroyedPile, attackerEntity.card];
      destroyedDestination = "DESTROYED";
    } else {
      updatedGraveyard = [...updatedGraveyard, attackerEntity.card];
      destroyedDestination = "GRAVEYARD";
    }
  }
  return {
    destroyedDestination,
    player: {
    ...attacker,
    healthPoints: Math.max(0, attacker.healthPoints - damageToAttackerPlayer),
    activeEntities: updatedEntities,
    graveyard: updatedGraveyard,
    destroyedPile: updatedDestroyedPile,
  },
  };
}

function buildUpdatedDefender(
  defender: IPlayer,
  defenderEntity: IBoardEntity,
  attackerEntity: IBoardEntity,
  defenderInstanceId: string,
  defenderDestroyed: boolean,
  damageToDefenderPlayer: number,
  attackerDestroyed: boolean,
): { player: IPlayer; destroyedDestination: "GRAVEYARD" | "DESTROYED" | null } {
  let updatedEntities = defender.activeEntities;
  let updatedGraveyard = defender.graveyard;
  let updatedDestroyedPile = [...(defender.destroyedPile ?? [])];
  let destroyedDestination: "GRAVEYARD" | "DESTROYED" | null = null;
  if (defenderDestroyed) {
    updatedEntities = updatedEntities.filter((entity) => entity.instanceId !== defenderInstanceId);
    if (shouldDestroyBattleTarget(attackerEntity, attackerDestroyed, defenderDestroyed)) {
      updatedDestroyedPile = [...updatedDestroyedPile, defenderEntity.card];
      destroyedDestination = "DESTROYED";
    } else {
      updatedGraveyard = [...updatedGraveyard, defenderEntity.card];
      destroyedDestination = "GRAVEYARD";
    }
  } else if (defenderEntity.mode === "SET") {
    updatedEntities = updatedEntities.map((entity) =>
      entity.instanceId === defenderInstanceId ? { ...entity, mode: "DEFENSE" } : entity,
    );
  }
  return {
    destroyedDestination,
    player: {
    ...defender,
    healthPoints: Math.max(0, defender.healthPoints - damageToDefenderPlayer),
    activeEntities: updatedEntities,
    graveyard: updatedGraveyard,
    destroyedPile: updatedDestroyedPile,
  },
  };
}

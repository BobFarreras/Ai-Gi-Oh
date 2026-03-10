// src/core/use-cases/game-engine/combat/internal/attack-player-updates.ts - Aplica actualizaciones de jugador tras resolver intercambio de combate.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { markAttackerAsUsed } from "@/core/use-cases/game-engine/combat/internal/attack-entities";

function shouldDestroyBattleTarget(winner: IBoardEntity, winnerDestroyed: boolean, loserDestroyed: boolean): boolean {
  return !winnerDestroyed && loserDestroyed && winner.card.effect?.action === "DESTROY_ENTITY_ON_BATTLE_WIN";
}

/**
 * Calcula estado final del atacante tras un combate entre entidades.
 */
export function buildUpdatedAttacker(
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

/**
 * Calcula estado final del defensor tras un combate entre entidades.
 */
export function buildUpdatedDefender(
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

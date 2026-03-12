// src/core/use-cases/game-engine/actions/internal/execution-effect-buffs.ts - Encapsula buffs de ATK/DEF para efectos de ejecución sin mezclar daño/curación.
import { CardArchetype } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";

/**
 * Aplica un buff de ATK a la entidad aliada con mayor ataque actual.
 */
export function boostBestAlliedAttack(player: IPlayer, value: number): { updatedPlayer: IPlayer; buffIds: string[] } {
  if (player.activeEntities.length === 0) {
    throw new GameRuleError("No tienes entidades en campo para aumentar ATK.");
  }
  const bestEntity = player.activeEntities.reduce((best, entity) => ((entity.card.attack ?? 0) > (best.card.attack ?? 0) ? entity : best));
  return {
    buffIds: [bestEntity.instanceId],
    updatedPlayer: {
      ...player,
      activeEntities: player.activeEntities.map((entity) =>
        entity.instanceId === bestEntity.instanceId
          ? { ...entity, card: { ...entity.card, attack: (entity.card.attack ?? 0) + value } }
          : entity,
      ),
    },
  };
}

/**
 * Aplica un buff de ATK/DEF a todas las entidades de un arquetipo.
 */
export function boostArchetypeStat(
  player: IPlayer,
  stat: "ATTACK" | "DEFENSE",
  archetype: CardArchetype,
  value: number,
): { updatedPlayer: IPlayer; buffIds: string[] } {
  const buffIds = player.activeEntities
    .filter((entity) => entity.card.archetype === archetype)
    .map((entity) => entity.instanceId);
  if (buffIds.length === 0) {
    throw new GameRuleError(`No hay entidades ${archetype} para aumentar ${stat === "ATTACK" ? "ATK" : "DEF"}.`);
  }
  return {
    buffIds,
    updatedPlayer: {
      ...player,
      activeEntities: player.activeEntities.map((entity) =>
        entity.card.archetype !== archetype
          ? entity
          : {
              ...entity,
              card:
                stat === "ATTACK"
                  ? { ...entity.card, attack: (entity.card.attack ?? 0) + value }
                  : { ...entity.card, defense: (entity.card.defense ?? 0) + value },
            },
      ),
    },
  };
}

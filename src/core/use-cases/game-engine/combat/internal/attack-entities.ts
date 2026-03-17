// src/core/use-cases/game-engine/combat/internal/attack-entities.ts - Utilidades para marcar y actualizar entidades involucradas en ataque.
import { IBoardEntity } from "@/core/entities/IPlayer";

export function markAttackerAsUsed(entities: IBoardEntity[], attackerInstanceId: string): IBoardEntity[] {
  return entities.map((entity) =>
    entity.instanceId === attackerInstanceId ? { ...entity, hasAttackedThisTurn: true } : entity,
  );
}


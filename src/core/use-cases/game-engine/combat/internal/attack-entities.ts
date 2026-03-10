// src/core/use-cases/game-engine/combat/internal/attack-entities.ts - Descripción breve del módulo.
import { IBoardEntity } from "@/core/entities/IPlayer";

export function markAttackerAsUsed(entities: IBoardEntity[], attackerInstanceId: string): IBoardEntity[] {
  return entities.map((entity) =>
    entity.instanceId === attackerInstanceId ? { ...entity, hasAttackedThisTurn: true } : entity,
  );
}


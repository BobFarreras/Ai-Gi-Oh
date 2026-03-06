import { IBoardEntity } from "@/core/entities/IPlayer";

export function markAttackerAsUsed(entities: IBoardEntity[], attackerInstanceId: string): IBoardEntity[] {
  return entities.map((entity) =>
    entity.instanceId === attackerInstanceId ? { ...entity, hasAttackedThisTurn: true } : entity,
  );
}

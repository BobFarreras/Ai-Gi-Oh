// src/components/game/board/battlefield/internal/entity-visibility.ts - Reglas visuales de ocultación/rotación para entidades en tablero.
import { IBoardEntity } from "@/core/entities/IPlayer";

interface IEntityVisibilityState {
  isFaceDown: boolean;
  isHorizontal: boolean;
}

/**
 * Calcula el estado visual de una entidad en tablero.
 * `SET` permanece boca abajo hasta ser revelada por una regla del motor.
 * `DEFENSE` siempre se muestra boca arriba, pero en horizontal.
 */
export function resolveEntityVisibility(entity: IBoardEntity | undefined, isRevealed: boolean): IEntityVisibilityState {
  if (!entity) {
    return { isFaceDown: false, isHorizontal: false };
  }

  const isFaceDown = entity.mode === "SET" && !isRevealed;
  const isHorizontal = entity.mode === "DEFENSE" || (entity.mode === "SET" && entity.card.type === "ENTITY");
  return { isFaceDown, isHorizontal };
}

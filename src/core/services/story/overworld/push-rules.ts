// src/core/services/story/overworld/push-rules.ts - Reglas puras de empuje de cajas (sokoban) del overworld Story.
import {
  IGridPosition,
  OverworldDirection,
  resolveDirectionDelta,
} from "@/core/services/story/overworld/overworld-types";
import {
  canWalkToTile,
  IResolvedMovementContext,
} from "@/core/services/story/overworld/movement-rules";

export interface IPushResolution {
  /** Caja que se empuja (celda que ocupa ahora). */
  boxTile: IGridPosition;
  /** Celda a la que se desplaza la caja. */
  boxDestination: IGridPosition;
}

/**
 * Resuelve un intento de empuje: el jugador está en `playerTile` y avanza en `direction`.
 * - Si la celda de delante NO tiene caja → `null` (no es un empuje; el movimiento normal decide).
 * - Si detrás de la caja hay otra caja, un muro, un límite o una puerta cerrada → `null` (bloqueado).
 * - Si la caja puede desplazarse una celda → devuelve su origen y destino.
 *
 * Pura: no muta nada. El motor aplica el desplazamiento y anima.
 */
export function resolvePush(
  playerTile: IGridPosition,
  direction: OverworldDirection,
  context: IResolvedMovementContext,
  isBoxAt: (position: IGridPosition) => boolean,
): IPushResolution | null {
  const delta = resolveDirectionDelta(direction);
  const boxTile: IGridPosition = {
    tileX: playerTile.tileX + delta.tileX,
    tileY: playerTile.tileY + delta.tileY,
  };
  if (!isBoxAt(boxTile)) return null;
  const boxDestination: IGridPosition = {
    tileX: boxTile.tileX + delta.tileX,
    tileY: boxTile.tileY + delta.tileY,
  };
  // No se apilan cajas ni se empuja contra muro/límite/puerta cerrada.
  if (isBoxAt(boxDestination)) return null;
  if (!canWalkToTile(boxDestination, context)) return null;
  return { boxTile, boxDestination };
}

// src/core/services/story/overworld/overworld-types.ts - Tipos base del motor overworld Story (rejilla, direcciones y estado de progreso).

/**
 * Posición lógica en la rejilla del mundo (celdas, no píxeles).
 */
export interface IGridPosition {
  tileX: number;
  tileY: number;
}

/**
 * Dirección cardinal de movimiento y orientación del personaje.
 */
export type OverworldDirection = "UP" | "DOWN" | "LEFT" | "RIGHT";

/**
 * Rejilla de colisión inmutable: `walkable[y][x] === true` si la celda es transitable.
 */
export interface IOverworldCollisionGrid {
  width: number;
  height: number;
  walkable: ReadonlyArray<ReadonlyArray<boolean>>;
}

/**
 * Estado de progreso del jugador en los tres ejes que ya usa Story
 * (visited/interacted en `player_story_world_state`, completed en `player_story_duel_progress`).
 */
export interface IOverworldProgressState {
  visitedNodeIds: ReadonlySet<string>;
  interactedNodeIds: ReadonlySet<string>;
  completedNodeIds: ReadonlySet<string>;
}

/**
 * Puerta lógica sobre una celda: bloquea el paso hasta que todos los requisitos estén resueltos.
 */
export interface IOverworldGate {
  id: string;
  tileX: number;
  tileY: number;
  requiredNodeIds: ReadonlyArray<string>;
}

const DIRECTION_DELTAS: Record<OverworldDirection, IGridPosition> = {
  UP: { tileX: 0, tileY: -1 },
  DOWN: { tileX: 0, tileY: 1 },
  LEFT: { tileX: -1, tileY: 0 },
  RIGHT: { tileX: 1, tileY: 0 },
};

/**
 * Devuelve el desplazamiento unitario de una dirección cardinal.
 */
export function resolveDirectionDelta(direction: OverworldDirection): IGridPosition {
  return DIRECTION_DELTAS[direction];
}

/**
 * Compara dos posiciones de rejilla por valor.
 */
export function areGridPositionsEqual(left: IGridPosition, right: IGridPosition): boolean {
  return left.tileX === right.tileX && left.tileY === right.tileY;
}

/**
 * Serializa una posición como clave estable para sets/maps.
 */
export function toGridPositionKey(position: IGridPosition): string {
  return `${position.tileX},${position.tileY}`;
}

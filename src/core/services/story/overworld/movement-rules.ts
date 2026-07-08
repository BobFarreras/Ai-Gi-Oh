// src/core/services/story/overworld/movement-rules.ts - Reglas puras de movimiento por celdas del overworld Story.
import { isGateOpen } from "@/core/services/story/overworld/interaction-rules";
import {
  IGridPosition,
  IOverworldCollisionGrid,
  IOverworldGate,
  IOverworldProgressState,
  OverworldDirection,
  resolveDirectionDelta,
  toGridPositionKey,
} from "@/core/services/story/overworld/overworld-types";

export interface IMovementContext {
  collisionGrid: IOverworldCollisionGrid;
  gates: ReadonlyArray<IOverworldGate>;
  progress: IOverworldProgressState;
  /** Celdas bloqueadas dinámicamente (p. ej. recompensas por recoger); se liberan al recogerlas. */
  blockedTileKeys?: ReadonlySet<string>;
  /** Celdas forzadas transitables (p. ej. la casilla de un rival derrotado que "se teletransporta"). */
  openTileKeys?: ReadonlySet<string>;
}

/**
 * Contexto de movimiento con las puertas cerradas ya resueltas.
 * Se precomputa una vez por tick/consulta para que las comprobaciones por celda sean O(1),
 * imprescindible dentro de bucles calientes como A* o el loop del engine.
 */
export interface IResolvedMovementContext {
  collisionGrid: IOverworldCollisionGrid;
  closedGateKeys: ReadonlySet<string>;
  openTileKeys: ReadonlySet<string>;
}

/**
 * Resuelve el estado de todas las puertas contra el progreso actual.
 */
export function resolveMovementContext(context: IMovementContext): IResolvedMovementContext {
  const closedGateKeys = new Set<string>();
  for (const gate of context.gates) {
    if (!isGateOpen(gate, context.progress)) {
      closedGateKeys.add(toGridPositionKey({ tileX: gate.tileX, tileY: gate.tileY }));
    }
  }
  for (const key of context.blockedTileKeys ?? []) closedGateKeys.add(key);
  return { collisionGrid: context.collisionGrid, closedGateKeys, openTileKeys: context.openTileKeys ?? new Set() };
}

/**
 * Comprueba que la posición cae dentro de los límites de la rejilla.
 */
export function isInsideGrid(position: IGridPosition, grid: IOverworldCollisionGrid): boolean {
  return (
    Number.isInteger(position.tileX) &&
    Number.isInteger(position.tileY) &&
    position.tileX >= 0 &&
    position.tileY >= 0 &&
    position.tileX < grid.width &&
    position.tileY < grid.height
  );
}

/**
 * Una celda es transitable si está dentro de límites, su colisión lo permite
 * y no hay una puerta cerrada sobre ella.
 */
export function canWalkToTile(
  position: IGridPosition,
  resolvedContext: IResolvedMovementContext,
): boolean {
  if (!isInsideGrid(position, resolvedContext.collisionGrid)) return false;
  const key = toGridPositionKey(position);
  if (resolvedContext.closedGateKeys.has(key)) return false;
  // Casilla liberada (rival derrotado que se teletransporta): transitable aunque su tile fuese sólido.
  if (resolvedContext.openTileKeys.has(key)) return true;
  return Boolean(resolvedContext.collisionGrid.walkable[position.tileY]?.[position.tileX]);
}

export interface IStepResolution {
  /** Celda destino si el paso es válido; `null` si el movimiento queda bloqueado. */
  target: IGridPosition | null;
  /** Orientación resultante: el personaje siempre gira hacia la dirección pedida, aunque no avance. */
  facing: OverworldDirection;
}

/**
 * Resuelve un paso desde `from` en `direction` aplicando límites, colisión y puertas.
 */
export function resolveStep(
  from: IGridPosition,
  direction: OverworldDirection,
  resolvedContext: IResolvedMovementContext,
): IStepResolution {
  const delta = resolveDirectionDelta(direction);
  const candidate: IGridPosition = {
    tileX: from.tileX + delta.tileX,
    tileY: from.tileY + delta.tileY,
  };
  if (!canWalkToTile(candidate, resolvedContext)) {
    return { target: null, facing: direction };
  }
  return { target: candidate, facing: direction };
}

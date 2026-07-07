// src/core/services/story/overworld/pathfinding.ts - A* determinista sobre rejilla para tap-to-move del overworld Story.
import {
  IResolvedMovementContext,
  canWalkToTile,
} from "@/core/services/story/overworld/movement-rules";
import {
  IGridPosition,
  areGridPositionsEqual,
} from "@/core/services/story/overworld/overworld-types";

/**
 * Orden fijo de expansión de vecinos para que la ruta sea determinista
 * ante empates de coste (misma ruta en todos los dispositivos y tests).
 */
const NEIGHBOR_DELTAS: ReadonlyArray<IGridPosition> = [
  { tileX: 0, tileY: -1 },
  { tileX: 1, tileY: 0 },
  { tileX: 0, tileY: 1 },
  { tileX: -1, tileY: 0 },
];

function manhattanDistance(from: IGridPosition, to: IGridPosition): number {
  return Math.abs(from.tileX - to.tileX) + Math.abs(from.tileY - to.tileY);
}

interface IPathNode {
  index: number;
  gCost: number;
  fCost: number;
  /** Orden de inserción: desempate estable para rutas deterministas. */
  insertionOrder: number;
}

/**
 * Busca la ruta más corta entre dos celdas transitables (incluye origen y destino).
 * Devuelve `null` si no hay ruta, si el destino no es transitable o si se supera
 * el presupuesto de expansión (mapas corruptos no pueden colgar el hilo principal).
 */
export function findGridPath(
  start: IGridPosition,
  goal: IGridPosition,
  resolvedContext: IResolvedMovementContext,
): IGridPosition[] | null {
  const { width, height } = resolvedContext.collisionGrid;
  if (!canWalkToTile(start, resolvedContext) || !canWalkToTile(goal, resolvedContext)) return null;
  if (areGridPositionsEqual(start, goal)) return [start];

  const totalCells = width * height;
  // Cada celda puede entrar en la open list hasta una vez por vecino (duplicados lazy),
  // así que el techo real de extracciones en un mapa válido es 4 * celdas.
  const maxExpansions = totalCells * 4;
  const toIndex = (position: IGridPosition): number => position.tileY * width + position.tileX;
  const toPosition = (index: number): IGridPosition => ({
    tileX: index % width,
    tileY: Math.floor(index / width),
  });

  // Estructuras planas indexadas por celda: sin objetos por nodo en el hot loop.
  const gCosts = new Float64Array(totalCells).fill(Number.POSITIVE_INFINITY);
  const cameFrom = new Int32Array(totalCells).fill(-1);
  const closed = new Uint8Array(totalCells);

  const startIndex = toIndex(start);
  const goalIndex = toIndex(goal);
  gCosts[startIndex] = 0;

  let insertionCounter = 0;
  const openList: IPathNode[] = [
    {
      index: startIndex,
      gCost: 0,
      fCost: manhattanDistance(start, goal),
      insertionOrder: insertionCounter++,
    },
  ];

  let expansions = 0;
  while (openList.length > 0) {
    if (++expansions > maxExpansions) return null;
    // Extracción del mejor nodo con desempate estable (fCost, luego orden de inserción).
    let bestListIndex = 0;
    for (let index = 1; index < openList.length; index++) {
      const candidate = openList[index];
      const best = openList[bestListIndex];
      if (
        candidate.fCost < best.fCost ||
        (candidate.fCost === best.fCost && candidate.insertionOrder < best.insertionOrder)
      ) {
        bestListIndex = index;
      }
    }
    const current = openList[bestListIndex];
    openList[bestListIndex] = openList[openList.length - 1];
    openList.pop();

    if (current.index === goalIndex) {
      const path: IGridPosition[] = [];
      let cursor = goalIndex;
      while (cursor !== -1) {
        path.push(toPosition(cursor));
        cursor = cameFrom[cursor];
      }
      return path.reverse();
    }
    if (closed[current.index]) continue;
    closed[current.index] = 1;

    const currentPosition = toPosition(current.index);
    for (const delta of NEIGHBOR_DELTAS) {
      const neighbor: IGridPosition = {
        tileX: currentPosition.tileX + delta.tileX,
        tileY: currentPosition.tileY + delta.tileY,
      };
      if (!canWalkToTile(neighbor, resolvedContext)) continue;
      const neighborIndex = toIndex(neighbor);
      if (closed[neighborIndex]) continue;
      const tentativeGCost = current.gCost + 1;
      if (tentativeGCost >= gCosts[neighborIndex]) continue;
      gCosts[neighborIndex] = tentativeGCost;
      cameFrom[neighborIndex] = current.index;
      openList.push({
        index: neighborIndex,
        gCost: tentativeGCost,
        fCost: tentativeGCost + manhattanDistance(neighbor, goal),
        insertionOrder: insertionCounter++,
      });
    }
  }
  return null;
}

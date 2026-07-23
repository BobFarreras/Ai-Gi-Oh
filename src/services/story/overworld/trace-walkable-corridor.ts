// src/services/story/overworld/trace-walkable-corridor.ts - Camino más corto entre dos casillas transitables de
// una rejilla de colisión (1 = transitable). Se usa para razonar sobre pasillos de laberinto sin hardcodear
// coordenadas: colocar un trigger "N casillas antes" de un objeto, o sacar los puntos por los que un NPC de
// cutscene entra andando por el corredor (los tramos rectos del maze, sin atravesar muros).
export interface ITileCoordinate {
  tileX: number;
  tileY: number;
}

const NEIGHBOUR_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function toKey(tileX: number, tileY: number): string {
  return `${tileX},${tileY}`;
}

/**
 * BFS sobre las casillas transitables (`collision[y][x] === 1`). Devuelve el camino INCLUYENDO ambos
 * extremos (`[from, ..., to]`), o `[]` si no hay ruta. Al ser un laberinto perfecto, el camino entre dos
 * celdas es único: sirve tanto para medir "N casillas antes" como para guionizar el recorrido de un NPC.
 */
export function traceWalkableCorridor(
  collision: ReadonlyArray<ReadonlyArray<number>>,
  from: ITileCoordinate,
  to: ITileCoordinate,
): ITileCoordinate[] {
  if (collision[from.tileY]?.[from.tileX] !== 1 || collision[to.tileY]?.[to.tileX] !== 1) return [];
  const cameFrom = new Map<string, ITileCoordinate | null>([[toKey(from.tileX, from.tileY), null]]);
  const queue: ITileCoordinate[] = [from];
  let cursor = 0;
  let reached = false;
  while (cursor < queue.length) {
    const tile = queue[cursor++];
    if (tile.tileX === to.tileX && tile.tileY === to.tileY) {
      reached = true;
      break;
    }
    for (const [deltaX, deltaY] of NEIGHBOUR_DELTAS) {
      const tileX = tile.tileX + deltaX;
      const tileY = tile.tileY + deltaY;
      if (collision[tileY]?.[tileX] !== 1) continue;
      const key = toKey(tileX, tileY);
      if (cameFrom.has(key)) continue;
      cameFrom.set(key, tile);
      queue.push({ tileX, tileY });
    }
  }
  if (!reached) return [];
  const path: ITileCoordinate[] = [];
  let step: ITileCoordinate | null = to;
  while (step) {
    path.push(step);
    step = cameFrom.get(toKey(step.tileX, step.tileY)) ?? null;
  }
  return path.reverse();
}

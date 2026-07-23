// src/services/story/overworld/trace-walkable-corridor.test.ts - BFS de pasillo sobre la rejilla de colisión.
import { traceWalkableCorridor } from "@/services/story/overworld/trace-walkable-corridor";

// 1 = transitable, 0 = muro. Pasillo en L: (1,1)->(3,1)->(3,3).
const GRID = [
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0],
];

describe("traceWalkableCorridor", () => {
  it("devuelve el camino incluyendo ambos extremos, casilla a casilla", () => {
    expect(traceWalkableCorridor(GRID, { tileX: 1, tileY: 1 }, { tileX: 3, tileY: 3 })).toEqual([
      { tileX: 1, tileY: 1 },
      { tileX: 2, tileY: 1 },
      { tileX: 3, tileY: 1 },
      { tileX: 3, tileY: 2 },
      { tileX: 3, tileY: 3 },
    ]);
  });

  it("un solo punto es un camino de longitud 1", () => {
    expect(traceWalkableCorridor(GRID, { tileX: 1, tileY: 1 }, { tileX: 1, tileY: 1 })).toEqual([{ tileX: 1, tileY: 1 }]);
  });

  it("devuelve [] si un extremo es muro o cae fuera de la rejilla", () => {
    expect(traceWalkableCorridor(GRID, { tileX: 1, tileY: 1 }, { tileX: 0, tileY: 0 })).toEqual([]);
    expect(traceWalkableCorridor(GRID, { tileX: 99, tileY: 99 }, { tileX: 1, tileY: 1 })).toEqual([]);
  });

  it("devuelve [] si no hay ruta entre ambos (zonas aisladas)", () => {
    const split = [
      [1, 0, 1],
      [1, 0, 1],
    ];
    expect(traceWalkableCorridor(split, { tileX: 0, tileY: 0 }, { tileX: 2, tileY: 1 })).toEqual([]);
  });
});

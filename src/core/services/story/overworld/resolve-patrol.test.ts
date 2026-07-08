// src/core/services/story/overworld/resolve-patrol.test.ts - Verifica el pacing de patrulla (avance, rebote en extremos y muros).
import {
  IPatrolConfig,
  advancePatrol,
  resolvePatrolTile,
} from "@/core/services/story/overworld/resolve-patrol";

const config: IPatrolConfig = { originX: 5, originY: 3, axis: "H", length: 2 };
const open = () => true;

describe("resolvePatrolTile", () => {
  it("mapea índice a celda según eje", () => {
    expect(resolvePatrolTile(config, 0)).toEqual({ tileX: 5, tileY: 3 });
    expect(resolvePatrolTile(config, 2)).toEqual({ tileX: 7, tileY: 3 });
    expect(resolvePatrolTile({ ...config, axis: "V" }, 2)).toEqual({ tileX: 5, tileY: 5 });
  });
});

describe("advancePatrol", () => {
  it("avanza en la dirección actual dentro del recorrido", () => {
    const step = advancePatrol(config, { index: 0, direction: 1 }, open);
    expect(step.target).toEqual({ tileX: 6, tileY: 3 });
    expect(step.runtime).toEqual({ index: 1, direction: 1 });
    expect(step.facing).toBe("RIGHT");
  });

  it("rebota al llegar al extremo final", () => {
    const step = advancePatrol(config, { index: 2, direction: 1 }, open);
    expect(step.target).toEqual({ tileX: 6, tileY: 3 });
    expect(step.runtime).toEqual({ index: 1, direction: -1 });
    expect(step.facing).toBe("LEFT");
  });

  it("rebota al llegar al extremo inicial", () => {
    const step = advancePatrol(config, { index: 0, direction: -1 }, open);
    expect(step.runtime).toEqual({ index: 1, direction: 1 });
    expect(step.facing).toBe("RIGHT");
  });

  it("rebota ante un muro antes del extremo", () => {
    const blockAt6 = (tile: { tileX: number; tileY: number }) => !(tile.tileX === 6 && tile.tileY === 3);
    const step = advancePatrol(config, { index: 0, direction: 1 }, blockAt6);
    // No puede ir a 6; intenta la otra dirección pero 0-1=-1 fuera → se queda quieto.
    expect(step.target).toBeNull();
  });

  it("mira hacia abajo/arriba en patrulla vertical", () => {
    const vertical: IPatrolConfig = { originX: 2, originY: 4, axis: "V", length: 3 };
    expect(advancePatrol(vertical, { index: 0, direction: 1 }, open).facing).toBe("DOWN");
    expect(advancePatrol(vertical, { index: 3, direction: 1 }, open).facing).toBe("UP");
  });
});

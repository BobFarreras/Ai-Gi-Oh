// src/core/services/story/overworld/movement-rules.test.ts - Verifica límites, colisión, puertas y resolución de pasos del overworld.
import {
  canWalkToTile,
  isInsideGrid,
  resolveMovementContext,
  resolveStep,
} from "@/core/services/story/overworld/movement-rules";
import {
  IOverworldCollisionGrid,
  IOverworldProgressState,
} from "@/core/services/story/overworld/overworld-types";

function buildGrid(rows: string[]): IOverworldCollisionGrid {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    walkable: rows.map((row) => [...row].map((cell) => cell === ".")),
  };
}

function buildProgress(partial?: Partial<{
  visited: string[];
  interacted: string[];
  completed: string[];
}>): IOverworldProgressState {
  return {
    visitedNodeIds: new Set(partial?.visited ?? []),
    interactedNodeIds: new Set(partial?.interacted ?? []),
    completedNodeIds: new Set(partial?.completed ?? []),
  };
}

// Rejilla 4x3: '.' transitable, '#' muro.
const grid = buildGrid([
  "....",
  ".#..",
  "....",
]);

describe("isInsideGrid", () => {
  it("acepta celdas dentro de límites y rechaza las exteriores", () => {
    expect(isInsideGrid({ tileX: 0, tileY: 0 }, grid)).toBe(true);
    expect(isInsideGrid({ tileX: 3, tileY: 2 }, grid)).toBe(true);
    expect(isInsideGrid({ tileX: -1, tileY: 0 }, grid)).toBe(false);
    expect(isInsideGrid({ tileX: 4, tileY: 0 }, grid)).toBe(false);
    expect(isInsideGrid({ tileX: 0, tileY: 3 }, grid)).toBe(false);
  });

  it("rechaza coordenadas no enteras (entrada corrupta)", () => {
    expect(isInsideGrid({ tileX: 1.5, tileY: 0 }, grid)).toBe(false);
    expect(isInsideGrid({ tileX: Number.NaN, tileY: 0 }, grid)).toBe(false);
  });
});

describe("canWalkToTile", () => {
  it("permite celdas libres y bloquea muros", () => {
    const context = resolveMovementContext({ collisionGrid: grid, gates: [], progress: buildProgress() });
    expect(canWalkToTile({ tileX: 0, tileY: 1 }, context)).toBe(true);
    expect(canWalkToTile({ tileX: 1, tileY: 1 }, context)).toBe(false);
  });

  it("bloquea celdas dinámicas (blockedTileKeys) y las libera al quitarlas", () => {
    const blocked = resolveMovementContext({
      collisionGrid: grid,
      gates: [],
      progress: buildProgress(),
      blockedTileKeys: new Set(["2,0"]),
    });
    expect(canWalkToTile({ tileX: 2, tileY: 0 }, blocked)).toBe(false);
    const freed = resolveMovementContext({ collisionGrid: grid, gates: [], progress: buildProgress() });
    expect(canWalkToTile({ tileX: 2, tileY: 0 }, freed)).toBe(true);
  });

  it("bloquea una celda con puerta cerrada y la libera al cumplir requisitos", () => {
    const gate = { id: "gate-1", tileX: 2, tileY: 0, requiredNodeIds: ["story-ch1-duel-1"] };
    const closedContext = resolveMovementContext({
      collisionGrid: grid,
      gates: [gate],
      progress: buildProgress(),
    });
    expect(canWalkToTile({ tileX: 2, tileY: 0 }, closedContext)).toBe(false);

    const openContext = resolveMovementContext({
      collisionGrid: grid,
      gates: [gate],
      progress: buildProgress({ completed: ["story-ch1-duel-1"] }),
    });
    expect(canWalkToTile({ tileX: 2, tileY: 0 }, openContext)).toBe(true);
  });
});

describe("resolveStep", () => {
  const context = resolveMovementContext({ collisionGrid: grid, gates: [], progress: buildProgress() });

  it("avanza a la celda vecina cuando es transitable", () => {
    const step = resolveStep({ tileX: 0, tileY: 0 }, "RIGHT", context);
    expect(step.target).toEqual({ tileX: 1, tileY: 0 });
    expect(step.facing).toBe("RIGHT");
  });

  it("bloquea el paso contra un muro pero gira la orientación", () => {
    const step = resolveStep({ tileX: 1, tileY: 0 }, "DOWN", context);
    expect(step.target).toBeNull();
    expect(step.facing).toBe("DOWN");
  });

  it("bloquea el paso fuera de los límites del mapa", () => {
    const step = resolveStep({ tileX: 0, tileY: 0 }, "LEFT", context);
    expect(step.target).toBeNull();
    expect(step.facing).toBe("LEFT");
  });
});

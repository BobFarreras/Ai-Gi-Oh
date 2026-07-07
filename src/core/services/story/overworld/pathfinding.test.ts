// src/core/services/story/overworld/pathfinding.test.ts - Verifica rutas A* deterministas sobre rejilla del overworld.
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import {
  IOverworldCollisionGrid,
  IOverworldGate,
  IOverworldProgressState,
} from "@/core/services/story/overworld/overworld-types";

function buildGrid(rows: string[]): IOverworldCollisionGrid {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    walkable: rows.map((row) => [...row].map((cell) => cell === ".")),
  };
}

function buildContext(rows: string[], gates: IOverworldGate[] = [], progress?: IOverworldProgressState) {
  return resolveMovementContext({
    collisionGrid: buildGrid(rows),
    gates,
    progress: progress ?? {
      visitedNodeIds: new Set<string>(),
      interactedNodeIds: new Set<string>(),
      completedNodeIds: new Set<string>(),
    },
  });
}

describe("findGridPath", () => {
  it("devuelve la ruta mínima en un pasillo recto", () => {
    const context = buildContext(["....."]);
    const path = findGridPath({ tileX: 0, tileY: 0 }, { tileX: 4, tileY: 0 }, context);
    expect(path).toEqual([
      { tileX: 0, tileY: 0 },
      { tileX: 1, tileY: 0 },
      { tileX: 2, tileY: 0 },
      { tileX: 3, tileY: 0 },
      { tileX: 4, tileY: 0 },
    ]);
  });

  it("rodea muros con la ruta más corta posible", () => {
    const context = buildContext([
      "...",
      ".#.",
      "...",
    ]);
    const path = findGridPath({ tileX: 0, tileY: 1 }, { tileX: 2, tileY: 1 }, context);
    expect(path).not.toBeNull();
    expect(path).toHaveLength(5);
    expect(path?.[0]).toEqual({ tileX: 0, tileY: 1 });
    expect(path?.[4]).toEqual({ tileX: 2, tileY: 1 });
    expect(path?.some((cell) => cell.tileX === 1 && cell.tileY === 1)).toBe(false);
  });

  it("devuelve null cuando no existe conexión", () => {
    const context = buildContext([
      ".#.",
      ".#.",
      ".#.",
    ]);
    expect(findGridPath({ tileX: 0, tileY: 0 }, { tileX: 2, tileY: 0 }, context)).toBeNull();
  });

  it("devuelve null si el destino no es transitable", () => {
    const context = buildContext(["..#"]);
    expect(findGridPath({ tileX: 0, tileY: 0 }, { tileX: 2, tileY: 0 }, context)).toBeNull();
  });

  it("devuelve solo el origen cuando origen y destino coinciden", () => {
    const context = buildContext(["..."]);
    expect(findGridPath({ tileX: 1, tileY: 0 }, { tileX: 1, tileY: 0 }, context)).toEqual([
      { tileX: 1, tileY: 0 },
    ]);
  });

  it("trata una puerta cerrada como muro y la atraviesa al abrirse", () => {
    const rows = ["...", "###", "..."];
    const openRows = ["...", "#.#", "..."];
    const gate: IOverworldGate = { id: "gate-1", tileX: 1, tileY: 1, requiredNodeIds: ["req-x"] };
    const closedContext = buildContext(openRows, [gate]);
    expect(findGridPath({ tileX: 1, tileY: 0 }, { tileX: 1, tileY: 2 }, closedContext)).toBeNull();

    const openContext = buildContext(openRows, [gate], {
      visitedNodeIds: new Set<string>(),
      interactedNodeIds: new Set<string>(["req-x"]),
      completedNodeIds: new Set<string>(),
    });
    const path = findGridPath({ tileX: 1, tileY: 0 }, { tileX: 1, tileY: 2 }, openContext);
    expect(path).toEqual([
      { tileX: 1, tileY: 0 },
      { tileX: 1, tileY: 1 },
      { tileX: 1, tileY: 2 },
    ]);
    // La variable rows documenta el caso totalmente tapiado (sin hueco de puerta).
    expect(findGridPath({ tileX: 1, tileY: 0 }, { tileX: 1, tileY: 2 }, buildContext(rows))).toBeNull();
  });

  it("es determinista ante empates: produce siempre la misma ruta", () => {
    const context = buildContext([
      "....",
      "....",
      "....",
    ]);
    const first = findGridPath({ tileX: 0, tileY: 0 }, { tileX: 3, tileY: 2 }, context);
    const second = findGridPath({ tileX: 0, tileY: 0 }, { tileX: 3, tileY: 2 }, context);
    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(first).toHaveLength(6);
  });

  it("resuelve mapas grandes dentro del presupuesto de expansión", () => {
    const size = 80;
    const rows = Array.from({ length: size }, () => ".".repeat(size));
    const context = buildContext(rows);
    const path = findGridPath({ tileX: 0, tileY: 0 }, { tileX: size - 1, tileY: size - 1 }, context);
    expect(path).not.toBeNull();
    expect(path).toHaveLength(2 * (size - 1) + 1);
  });
});

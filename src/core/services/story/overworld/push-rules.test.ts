// src/core/services/story/overworld/push-rules.test.ts - Reglas puras de empuje de cajas.
import { resolvePush } from "@/core/services/story/overworld/push-rules";
import {
  IResolvedMovementContext,
  resolveMovementContext,
} from "@/core/services/story/overworld/movement-rules";
import { IGridPosition, toGridPositionKey } from "@/core/services/story/overworld/overworld-types";

/** Rejilla 5x1 totalmente transitable salvo donde se indique. */
function buildContext(walkableWidth = 5, extraBlocked: string[] = []): IResolvedMovementContext {
  const walkable = [Array.from({ length: walkableWidth }, () => true)];
  return resolveMovementContext({
    collisionGrid: { width: walkableWidth, height: 1, walkable },
    gates: [],
    progress: { visitedNodeIds: new Set(), interactedNodeIds: new Set(), completedNodeIds: new Set() },
    blockedTileKeys: new Set(extraBlocked),
  });
}

function boxSet(...boxes: IGridPosition[]): (p: IGridPosition) => boolean {
  const keys = new Set(boxes.map(toGridPositionKey));
  return (p) => keys.has(toGridPositionKey(p));
}

describe("resolvePush", () => {
  it("empuja una caja a la celda libre de detrás", () => {
    const context = buildContext();
    const result = resolvePush({ tileX: 0, tileY: 0 }, "RIGHT", context, boxSet({ tileX: 1, tileY: 0 }));
    expect(result).toEqual({ boxTile: { tileX: 1, tileY: 0 }, boxDestination: { tileX: 2, tileY: 0 } });
  });

  it("no es empuje si no hay caja delante", () => {
    const context = buildContext();
    expect(resolvePush({ tileX: 0, tileY: 0 }, "RIGHT", context, boxSet())).toBeNull();
  });

  it("no empuja si detrás de la caja hay otra caja", () => {
    const context = buildContext();
    const result = resolvePush(
      { tileX: 0, tileY: 0 },
      "RIGHT",
      context,
      boxSet({ tileX: 1, tileY: 0 }, { tileX: 2, tileY: 0 }),
    );
    expect(result).toBeNull();
  });

  it("no empuja contra el borde del mapa", () => {
    const context = buildContext(2); // solo columnas 0 y 1
    const result = resolvePush({ tileX: 0, tileY: 0 }, "RIGHT", context, boxSet({ tileX: 1, tileY: 0 }));
    expect(result).toBeNull();
  });

  it("no empuja si la celda de destino está bloqueada (p. ej. puerta cerrada)", () => {
    const context = buildContext(5, [toGridPositionKey({ tileX: 2, tileY: 0 })]);
    const result = resolvePush({ tileX: 0, tileY: 0 }, "RIGHT", context, boxSet({ tileX: 1, tileY: 0 }));
    expect(result).toBeNull();
  });
});

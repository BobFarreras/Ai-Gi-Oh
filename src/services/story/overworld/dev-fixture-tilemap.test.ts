// src/services/story/overworld/dev-fixture-tilemap.test.ts - Blinda el mapa fixture: válido, y el portal solo se alcanza cruzando la puerta.
import { buildOverworldDevFixtureTilemap } from "@/services/story/overworld/dev-fixture-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";

function buildProgress(completed: string[]): IOverworldProgressState {
  return {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(),
    completedNodeIds: new Set<string>(completed),
  };
}

describe("buildOverworldDevFixtureTilemap", () => {
  it("se construye y valida sin lanzar", () => {
    expect(() => buildOverworldDevFixtureTilemap()).not.toThrow();
  });

  it("no define atlasSrc (render procedural)", () => {
    expect(buildOverworldDevFixtureTilemap().atlasSrc).toBeUndefined();
  });

  it("bloquea el portal hasta ganar el duelo y lo abre después", () => {
    const tilemap = buildOverworldDevFixtureTilemap();
    const collisionGrid = buildCollisionGridFromTilemap(tilemap);
    const gates = listGatesFromTilemap(tilemap);
    const spawn = tilemap.spawns[0];
    const warp = tilemap.objects.find((object) => object.kind === "WARP");
    expect(warp).toBeDefined();

    const closedContext = resolveMovementContext({ collisionGrid, gates, progress: buildProgress([]) });
    const blockedPath = findGridPath(
      { tileX: spawn.tileX, tileY: spawn.tileY },
      { tileX: warp!.tileX, tileY: warp!.tileY },
      closedContext,
    );
    expect(blockedPath).toBeNull();

    const openContext = resolveMovementContext({
      collisionGrid,
      gates,
      progress: buildProgress(["story-ch1-duel-1"]),
    });
    const openPath = findGridPath(
      { tileX: spawn.tileX, tileY: spawn.tileY },
      { tileX: warp!.tileX, tileY: warp!.tileY },
      openContext,
    );
    expect(openPath).not.toBeNull();
    // La ruta abierta pasa obligatoriamente por la celda de la puerta (choke real).
    expect(openPath?.some((cell) => cell.tileX === 33 && cell.tileY === 14)).toBe(true);
  });
});

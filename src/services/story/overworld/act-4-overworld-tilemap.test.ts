// src/services/story/overworld/act-4-overworld-tilemap.test.ts - Blinda el esqueleto del Acto 4 (Fase 1):
// válido, ambiente verde TERMINAL, y caminable de la entrada al jefe (aún sin gates ni rivales).
import { buildAct4OverworldTilemap } from "@/services/story/overworld/act-4-overworld-tilemap";
import { buildOverworldTilemap } from "@/services/story/overworld/resolve-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";

function walkContext() {
  const tilemap = buildAct4OverworldTilemap();
  const state: IOverworldProgressState = {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(),
    completedNodeIds: new Set<string>(),
  };
  return {
    tilemap,
    context: resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: state,
      openTileKeys: new Set<string>(),
    }),
  };
}

describe("buildAct4OverworldTilemap (esqueleto, Fase 1)", () => {
  it("se construye y valida sin lanzar, en ambiente TERMINAL (verde)", () => {
    const tilemap = buildAct4OverworldTilemap();
    expect(tilemap.ambient).toBe("TERMINAL");
    expect(tilemap.act).toBe(4);
    expect(tilemap.id).toBe("act-4");
  });

  it("queda registrado y resoluble por su mapId 'act-4'", () => {
    expect(buildOverworldTilemap("act-4")).not.toBeNull();
  });

  it("expone el spawn 'spawn-entry' al que llega el portal del Acto 3", () => {
    const tilemap = buildAct4OverworldTilemap();
    expect(tilemap.defaultSpawnId).toBe("spawn-entry");
    expect(tilemap.spawns.some((spawn) => spawn.id === "spawn-entry")).toBe(true);
  });

  it("tiene servicios (mercado/arsenal/salir) y retorno al Acto 3", () => {
    const kinds = new Set(buildAct4OverworldTilemap().objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
    const warp = buildAct4OverworldTilemap().objects.find((object) => object.kind === "WARP");
    expect(warp?.warp?.toMapId).toBe("act-3");
  });

  it("es caminable de la entrada (spawn) a la sala del jefe: sin gates aún, todo conectado", () => {
    const { tilemap, context } = walkContext();
    const spawn = tilemap.spawns[0];
    const bossRoomTile = { tileX: 26, tileY: 7 }; // centro de la sala del jefe (arriba)
    const path = findGridPath({ tileX: spawn.tileX, tileY: spawn.tileY }, bossRoomTile, context);
    expect(path).not.toBeNull();
  });

  it("es más grande que el Acto 3 (mapa amplio)", () => {
    const tilemap = buildAct4OverworldTilemap();
    expect(tilemap.width * tilemap.height).toBeGreaterThan(40 * 44);
  });
});

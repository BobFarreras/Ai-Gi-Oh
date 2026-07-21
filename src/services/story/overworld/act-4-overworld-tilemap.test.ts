// src/services/story/overworld/act-4-overworld-tilemap.test.ts - Blinda el Acto 4: válido, ambiente verde
// TERMINAL, registrado, y el laberinto de la Fase 2 (caja + placa + cinta + reset) que abre la compuerta a
// las plantas altas. Sin la placa pulsada, el jefe es inalcanzable (puzzle obligatorio).
import { buildAct4OverworldTilemap } from "@/services/story/overworld/act-4-overworld-tilemap";
import { buildOverworldTilemap } from "@/services/story/overworld/resolve-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";

const PLATE = "story-ch4-plate-lab";

function contextFor(interacted: string[] = []) {
  const tilemap = buildAct4OverworldTilemap();
  const state: IOverworldProgressState = {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(interacted),
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

function spawnTile(tilemap: ReturnType<typeof buildAct4OverworldTilemap>) {
  const spawn = tilemap.spawns[0];
  return { tileX: spawn.tileX, tileY: spawn.tileY };
}

describe("buildAct4OverworldTilemap", () => {
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
    const objects = buildAct4OverworldTilemap().objects;
    const kinds = new Set(objects.map((object) => object.kind));
    expect(kinds.has("MARKET")).toBe(true);
    expect(kinds.has("ARSENAL")).toBe(true);
    expect(kinds.has("TELEPORT")).toBe(true);
    expect(objects.find((object) => object.kind === "WARP")?.warp?.toMapId).toBe("act-3");
  });

  it("es más grande que el Acto 3 (mapa amplio)", () => {
    const tilemap = buildAct4OverworldTilemap();
    expect(tilemap.width * tilemap.height).toBeGreaterThan(40 * 44);
  });

  it("estrena el laberinto: caja empujable, placa, botón de reinicio y una cinta", () => {
    const tilemap = buildAct4OverworldTilemap();
    const kinds = tilemap.objects.map((object) => object.kind);
    expect(kinds).toContain("BOX");
    expect(kinds).toContain("PLATE");
    expect(kinds).toContain("BOX_RESET");
    // Al menos una casilla de cinta (índices BELT_* 6..9) en la capa ground.
    const hasBelt = tilemap.layers.ground.some((row) => row.some((cell) => cell >= 6 && cell <= 9));
    expect(hasBelt).toBe(true);
  });

  it("la compuerta del laberinto exige la placa: sin pulsarla el jefe es inalcanzable", () => {
    const bossRoomTile = { tileX: 26, tileY: 7 };
    const locked = contextFor([]);
    expect(findGridPath(spawnTile(locked.tilemap), bossRoomTile, locked.context)).toBeNull();
    const opened = contextFor([PLATE]);
    expect(findGridPath(spawnTile(opened.tilemap), bossRoomTile, opened.context)).not.toBeNull();
  });

  it("la compuerta requiere exactamente la placa del laberinto", () => {
    const gate = buildAct4OverworldTilemap().objects.find((object) => object.id === "story-a4-gate-lab")!;
    expect(gate.gateRequiredNodeIds).toContain(PLATE);
  });

  it("la placa es un EVENT persistible en el registro (mark-interacted, anti soft-lock)", () => {
    const definition = findStoryVirtualNodeDefinition(PLATE);
    expect(definition).not.toBeNull();
    expect(definition!.nodeType).toBe("EVENT");
  });
});

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
import { GROUND_TILE, invertBeltKind, resolveBeltDirection } from "@/services/story/overworld/overworld-tile-kinds";

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

  it("la compuerta terminal→jefe requiere exactamente la placa del laberinto", () => {
    const gate = buildAct4OverworldTilemap().objects.find((object) => object.id === "story-a4-gate-boss")!;
    expect(gate.gateRequiredNodeIds).toContain(PLATE);
  });

  it("la placa y el botón de la cinta son EVENT persistibles en el registro (mark-interacted)", () => {
    for (const id of [PLATE, "story-ch4-belt-button"]) {
      const definition = findStoryVirtualNodeDefinition(id);
      expect(definition).not.toBeNull();
      expect(definition!.nodeType).toBe("EVENT");
    }
  });

  it("belt-toggle: el puente lab→terminal es una cinta EN CONTRA y el botón la controla e invierte", () => {
    const tilemap = buildAct4OverworldTilemap();
    // El puente (x=26, y=22..24) baja (BELT_DOWN) por defecto: no se sube.
    for (const y of [22, 23, 24]) {
      expect(resolveBeltDirection(tilemap.layers.ground[y][26])).toBe("DOWN");
    }
    // El botón (SWITCH) controla justo esas casillas.
    const button = tilemap.objects.find((object) => object.id === "story-ch4-belt-button")!;
    expect(button.kind).toBe("SWITCH");
    expect(button.beltToggleRect).toEqual({ x0: 26, y0: 22, x1: 26, y1: 24 });
    // Invertir el tile de cinta lo pone a subir (lo que hace el engine al accionar el botón).
    expect(invertBeltKind(GROUND_TILE.BELT_DOWN)).toBe(GROUND_TILE.BELT_UP);
  });
});

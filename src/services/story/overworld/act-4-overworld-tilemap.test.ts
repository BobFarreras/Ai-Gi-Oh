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
import { IOverworldProgressState, toGridPositionKey } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";
import { GROUND_TILE, invertBeltKind, resolveBeltDirection } from "@/services/story/overworld/overworld-tile-kinds";

const PLATE = "story-ch4-plate-lab";
const DUEL_1 = "story-ch4-duel-1";
const GENNVIM = "story-ch4-duel-6";

function contextFor(progress: { completed?: string[]; interacted?: string[] } = {}) {
  const tilemap = buildAct4OverworldTilemap();
  const completed = new Set<string>(progress.completed ?? []);
  const state: IOverworldProgressState = {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(progress.interacted ?? []),
    completedNodeIds: completed,
  };
  // Rivales vencidos liberan su casilla (se teletransportan), como en el engine.
  const openTileKeys = new Set<string>(
    tilemap.objects
      .filter((object) => (object.kind === "DUEL" || object.kind === "BOSS") && completed.has(object.id))
      .map((object) => toGridPositionKey({ tileX: object.tileX, tileY: object.tileY })),
  );
  return {
    tilemap,
    context: resolveMovementContext({
      collisionGrid: buildCollisionGridFromTilemap(tilemap),
      gates: listGatesFromTilemap(tilemap),
      progress: state,
      openTileKeys,
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

  it("GenNvim (boss 1) exige vencer al centinela de entrada y pulsar la placa", () => {
    const approach = { tileX: 26, tileY: 10 }; // casilla contigua (debajo) de GenNvim (26,9)
    // Sin nada: el centinela de entrada (duel-1) bloquea el único corredor de subida.
    expect(findGridPath(spawnTile(buildAct4OverworldTilemap()), approach, contextFor({}).context)).toBeNull();
    // Centinela vencido pero sin placa: la compuerta terminal->jefe sigue cerrada.
    const noPlate = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(noPlate.tilemap), approach, noPlate.context)).toBeNull();
    // Centinela vencido + placa: GenNvim es alcanzable.
    const ready = contextFor({ completed: [DUEL_1], interacted: [PLATE] });
    expect(findGridPath(spawnTile(ready.tilemap), approach, ready.context)).not.toBeNull();
  });

  it("Midutech (boss final) exige haber vencido a GenNvim: la puerta post-jefe lo sella", () => {
    const approach = { tileX: 26, tileY: 5 }; // casilla contigua (debajo) de Midutech (26,4)
    // Con placa y entrada despejadas pero GenNvim vivo: la puerta post-jefe sella a Midutech.
    const beforeBoss = contextFor({ completed: [DUEL_1], interacted: [PLATE] });
    expect(findGridPath(spawnTile(beforeBoss.tilemap), approach, beforeBoss.context)).toBeNull();
    // GenNvim vencido: se libera su casilla y se abre la puerta post-jefe -> Midutech alcanzable.
    const afterBoss = contextFor({ completed: [DUEL_1, GENNVIM], interacted: [PLATE] });
    expect(findGridPath(spawnTile(afterBoss.tilemap), approach, afterBoss.context)).not.toBeNull();
  });

  it("coloca los 3 objetos (USB + aumentos ATK/DEF) y están registrados para claim-reward", () => {
    const objects = buildAct4OverworldTilemap().objects;
    const caches = objects.filter((object) => object.kind === "REWARD_OBJECT").map((object) => object.id).sort();
    expect(caches).toEqual(["story-ch4-cache-atk", "story-ch4-cache-def", "story-ch4-cache-usb"]);
    for (const id of caches) {
      const definition = findStoryVirtualNodeDefinition(id);
      expect(definition?.nodeType).toBe("REWARD_OBJECT");
    }
  });

  it("el aumento de DEFENSA está tras el guardia duel-4 (rama alta sellada): obligatorio vencerlo", () => {
    // El objeto (7,29) es sólido (se recoge desde el lado): comprobamos la casilla contigua (8,29).
    const approach = { tileX: 8, tileY: 29 };
    // Sin vencer a duel-4: la sala izq alta (y su aumento) es inalcanzable.
    const locked = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(locked.tilemap), approach, locked.context)).toBeNull();
    // Vencido duel-4 (y duel-1 para entrar): alcanzable.
    const cleared = contextFor({ completed: [DUEL_1, "story-ch4-duel-4"] });
    expect(findGridPath(spawnTile(cleared.tilemap), approach, cleared.context)).not.toBeNull();
  });

  it("laberinto: la subida central es una cinta que sube, flanqueada por trampas que bajan", () => {
    const ground = buildAct4OverworldTilemap().layers.ground;
    for (const y of [26, 27, 28, 29, 30]) {
      expect(resolveBeltDirection(ground[y][26])).toBe("UP"); // centro sube
      expect(resolveBeltDirection(ground[y][25])).toBe("DOWN"); // trampa izq
      expect(resolveBeltDirection(ground[y][27])).toBe("DOWN"); // trampa der
    }
  });

  it("coloca los 7 rivales del capítulo 4 y marca a GenNvim/Midutech como BOSS", () => {
    const objects = buildAct4OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (let n = 1; n <= 7; n++) expect(ids.has(`story-ch4-duel-${n}`)).toBe(true);
    const bosses = objects.filter((object) => object.kind === "BOSS").map((object) => object.id).sort();
    expect(bosses).toEqual(["story-ch4-duel-6", "story-ch4-duel-7"]);
    const postBossGate = objects.find((object) => object.id === "story-a4-gate-postboss")!;
    expect(postBossGate.gateRequiredNodeIds).toEqual(["story-ch4-duel-6"]);
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

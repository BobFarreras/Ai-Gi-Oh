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

const SWITCH_ID = "story-ch4-belt-switch";
const SWITCH_TOP_ID = "story-ch4-belt-switch-top";
const DUEL_1 = "story-ch4-duel-1";
const DUEL_3 = "story-ch4-duel-3";
const DUEL_4 = "story-ch4-duel-4";
const DUEL_5 = "story-ch4-duel-5";
const DUEL_8 = "story-ch4-duel-8";
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

// Celda transitable contigua a un objeto sólido (desde la que se interactúa/recoge).
function approachOf(
  tilemap: ReturnType<typeof buildAct4OverworldTilemap>,
  object: { tileX: number; tileY: number },
): { tileX: number; tileY: number } | null {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
    const tileX = object.tileX + dx;
    const tileY = object.tileY + dy;
    if (tilemap.collision[tileY]?.[tileX] === 1) return { tileX, tileY };
  }
  return null;
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

  it("estrena el laberinto: interruptor del puente, carta de recompensa y una cinta", () => {
    const tilemap = buildAct4OverworldTilemap();
    const kinds = tilemap.objects.map((object) => object.kind);
    expect(kinds).toContain("SWITCH");
    expect(kinds).toContain("REWARD_CARD");
    // Al menos una casilla de cinta (índices BELT_* 6..9) en la capa ground.
    const hasBelt = tilemap.layers.ground.some((row) => row.some((cell) => cell >= 6 && cell <= 9));
    expect(hasBelt).toBe(true);
  });

  it("GenNvim (boss 1) exige vencer al centinela de entrada (duel-1) y al de antesala (duel-5)", () => {
    const approach = { tileX: 26, tileY: 10 }; // casilla contigua (debajo) de GenNvim (26,9)
    // Sin nada: el centinela de entrada (duel-1) bloquea el único corredor de subida.
    expect(findGridPath(spawnTile(buildAct4OverworldTilemap()), approach, contextFor({}).context)).toBeNull();
    // Entrada despejada pero sin duel-5: la compuerta terminal->jefe sigue cerrada.
    const noGate = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(noGate.tilemap), approach, noGate.context)).toBeNull();
    // duel-1 + duel-5 vencidos: GenNvim es alcanzable.
    const ready = contextFor({ completed: [DUEL_1, DUEL_5] });
    expect(findGridPath(spawnTile(ready.tilemap), approach, ready.context)).not.toBeNull();
  });

  it("Midutech (boss final) exige haber vencido a GenNvim: la puerta post-jefe lo sella", () => {
    const approach = { tileX: 26, tileY: 5 }; // casilla contigua (debajo) de Midutech (26,4)
    // Con la compuerta abierta pero GenNvim vivo: la puerta post-jefe sella a Midutech.
    const beforeBoss = contextFor({ completed: [DUEL_1, DUEL_5] });
    expect(findGridPath(spawnTile(beforeBoss.tilemap), approach, beforeBoss.context)).toBeNull();
    // GenNvim vencido: se libera su casilla y se abre la puerta post-jefe -> Midutech alcanzable.
    const afterBoss = contextFor({ completed: [DUEL_1, DUEL_5, GENNVIM] });
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

  it("el aumento de DEFENSA está en el maze rightLow tras el guardia duel-3: obligatorio vencerlo", () => {
    // El aumento DEF es sólido (se recoge desde el lado); su callejón está dentro del maze rightLow, cuya única
    // entrada (corredor) la guarda duel-3. Comprobamos la casilla contigua al objeto.
    const tilemap = buildAct4OverworldTilemap();
    const def = tilemap.objects.find((object) => object.id === "story-ch4-cache-def")!;
    const approach = approachOf(tilemap, def);
    expect(approach).not.toBeNull();
    // Sin vencer a duel-3: el maze rightLow (y su aumento DEF) es inalcanzable.
    const locked = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(locked.tilemap), approach!, locked.context)).toBeNull();
    // Vencido duel-3 (y duel-1 para entrar): alcanzable.
    const cleared = contextFor({ completed: [DUEL_1, DUEL_3] });
    expect(findGridPath(spawnTile(cleared.tilemap), approach!, cleared.context)).not.toBeNull();
  });

  it("el aumento de ATAQUE está en el maze leftLow tras el guardia duel-2: obligatorio vencerlo", () => {
    const tilemap = buildAct4OverworldTilemap();
    const atk = tilemap.objects.find((object) => object.id === "story-ch4-cache-atk")!;
    const approach = approachOf(tilemap, atk);
    expect(approach).not.toBeNull();
    const locked = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(locked.tilemap), approach!, locked.context)).toBeNull();
    const cleared = contextFor({ completed: [DUEL_1, "story-ch4-duel-2"] });
    expect(findGridPath(spawnTile(cleared.tilemap), approach!, cleared.context)).not.toBeNull();
  });

  it("laberinto de servidores: hay muros de atrezzo (overlay) en la sala del laberinto", () => {
    const overlay = buildAct4OverworldTilemap().layers.overlay;
    // Al menos algunos muros de servidor dentro del laberinto (y 26..32) forman los pasillos.
    let walls = 0;
    for (let y = 26; y <= 32; y++) for (let x = 18; x <= 34; x++) if (overlay[y]?.[x]) walls++;
    expect(walls).toBeGreaterThan(8);
  });

  it("coloca los 8 rivales del capítulo 4 (duel-8 es DUEL) y marca a GenNvim/Midutech como BOSS", () => {
    const objects = buildAct4OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (let n = 1; n <= 8; n++) expect(ids.has(`story-ch4-duel-${n}`)).toBe(true);
    // duel-8 (guardián de la Hydra) es DUEL, no BOSS.
    expect(objects.find((object) => object.id === "story-ch4-duel-8")?.kind).toBe("DUEL");
    const bosses = objects.filter((object) => object.kind === "BOSS").map((object) => object.id).sort();
    expect(bosses).toEqual(["story-ch4-duel-6", "story-ch4-duel-7"]);
    const postBossGate = objects.find((object) => object.id === "story-a4-gate-postboss")!;
    expect(postBossGate.gateRequiredNodeIds).toEqual(["story-ch4-duel-6"]);
  });

  it("la carta HYDRA está tras el guardia duel-8 (dentro del maze leftUp): obligatorio vencerlo", () => {
    // duel-8 es sólido y ocupa la ÚNICA celda contigua al callejón de la Hydra: sin vencerlo, la carta es
    // inalcanzable (nadie puede pararse a su lado). Al vencerlo se libera esa celda.
    const tilemap = buildAct4OverworldTilemap();
    const duel8 = tilemap.objects.find((object) => object.id === DUEL_8)!;
    const hydra = tilemap.objects.find((object) => object.id === "story-ch4-card-hydra")!;
    // La celda de duel-8 es la contigua a la carta Hydra (su acceso).
    const adjacency = Math.abs(duel8.tileX - hydra.tileX) + Math.abs(duel8.tileY - hydra.tileY);
    expect(adjacency).toBe(1);
    const target = { tileX: duel8.tileX, tileY: duel8.tileY };
    // Con duel-1 (subir) + duel-4 (entrar al maze) pero SIN duel-8: la celda contigua a la Hydra está bloqueada.
    const locked = contextFor({ completed: [DUEL_1, DUEL_4] });
    expect(findGridPath(spawnTile(locked.tilemap), target, locked.context)).toBeNull();
    // + duel-8 vencido: se libera su celda (contigua a la Hydra) → alcanzable.
    const cleared = contextFor({ completed: [DUEL_1, DUEL_4, DUEL_8] });
    expect(findGridPath(spawnTile(cleared.tilemap), target, cleared.context)).not.toBeNull();
  });

  it("la compuerta terminal→jefe requiere vencer al centinela de antesala (duel-5)", () => {
    const gate = buildAct4OverworldTilemap().objects.find((object) => object.id === "story-a4-gate-boss")!;
    expect(gate.gateRequiredNodeIds).toContain(DUEL_5);
  });

  it("belt-toggle REVERSIBLE: dos interruptores (abajo/arriba) controlan la MISMA cinta del puente", () => {
    const tilemap = buildAct4OverworldTilemap();
    const rect = { x0: 26, y0: 22, x1: 26, y1: 24 };
    // El puente (x=26, y=22..24) baja (BELT_DOWN) por defecto: no se sube sin accionar un interruptor.
    for (const y of [22, 23, 24]) {
      expect(resolveBeltDirection(tilemap.layers.ground[y][26])).toBe("DOWN");
    }
    expect(invertBeltKind(GROUND_TILE.BELT_DOWN)).toBe(GROUND_TILE.BELT_UP);
    // Interruptor de ABAJO (cámara del laberinto 2) e interruptor de ARRIBA (terminal): mismo beltToggleRect.
    const bottom = tilemap.objects.find((object) => object.id === SWITCH_ID)!;
    const top = tilemap.objects.find((object) => object.id === SWITCH_TOP_ID)!;
    expect(bottom.kind).toBe("SWITCH");
    expect(top.kind).toBe("SWITCH");
    expect(bottom.beltToggleRect).toEqual(rect);
    expect(top.beltToggleRect).toEqual(rect);
    // El de arriba está en el terminal (y<=21) para poder revertir la cinta y bajar; el de abajo en la cámara (y>=25).
    expect(top.tileY).toBeLessThanOrEqual(21);
    expect(bottom.tileY).toBeGreaterThanOrEqual(25);
  });
});

// src/services/story/overworld/act-4-overworld-tilemap.test.ts - Blinda el Acto 4: válido, ambiente verde
// TERMINAL, registrado, y el laberinto de la Fase 2 (caja + placa + cinta + reset) que abre la compuerta a
// las plantas altas. Sin la placa pulsada, el jefe es inalcanzable (puzzle obligatorio).
import {
  ACT_5_PORTAL_ID,
  CARD_FORGE_DUEL_ID,
  CARD_FORGE_GENNVIM_TILE,
  CARD_FORGE_MAX_TILES_FROM_MACHINE,
  CARD_FORGE_MIDUTECH_TILE,
  CARD_FORGE_SCENERY_GENNVIM_ID,
  CARD_FORGE_SCENERY_MIDUTECH_ID,
  CARD_FORGE_TRIGGER_ID,
  HYDRA_AMBUSH_TILES_BEFORE_CARD,
  HYDRA_AMBUSH_TRIGGER_ID,
  buildAct4OverworldTilemap,
} from "@/services/story/overworld/act-4-overworld-tilemap";
import { traceWalkableCorridor } from "@/services/story/overworld/trace-walkable-corridor";
import { buildOverworldTilemap } from "@/services/story/overworld/resolve-overworld-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";
import { resolveMovementContext } from "@/core/services/story/overworld/movement-rules";
import { findGridPath } from "@/core/services/story/overworld/pathfinding";
import { IOverworldProgressState, toGridPositionKey } from "@/core/services/story/overworld/overworld-types";
import { findStoryVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-registry";
import { GROUND_TILE, OVERLAY_TILE, invertBeltKind, resolveBeltDirection } from "@/services/story/overworld/overworld-tile-kinds";

const SWITCH_ID = "story-ch4-belt-switch";
const SWITCH_TOP_ID = "story-ch4-belt-switch-top";
const DUEL_1 = "story-ch4-duel-1";
const DUEL_3 = "story-ch4-duel-3";
const DUEL_4 = "story-ch4-duel-4";
const DUEL_5 = "story-ch4-duel-5";
const DUEL_8 = "story-ch4-duel-8";
const DUEL_9 = "story-ch4-duel-9";

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

// ¿Se llega de `from` a `target` si se tapia una casilla concreta? (BFS crudo sobre la rejilla, sin gates ni
// progreso: sirve para razonar sobre "esta celda es ruta única" dentro de una sala.)
function isReachableWithBlockedTile(
  tilemap: ReturnType<typeof buildAct4OverworldTilemap>,
  from: { tileX: number; tileY: number },
  target: { tileX: number; tileY: number },
  blocked: { tileX: number; tileY: number },
): boolean {
  const key = (tileX: number, tileY: number) => `${tileX},${tileY}`;
  const seen = new Set<string>([key(from.tileX, from.tileY)]);
  const queue: Array<{ tileX: number; tileY: number }> = [{ tileX: from.tileX, tileY: from.tileY }];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.tileX === target.tileX && current.tileY === target.tileY) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
      const tileX = current.tileX + dx;
      const tileY = current.tileY + dy;
      if (tileX === blocked.tileX && tileY === blocked.tileY) continue;
      if (tilemap.collision[tileY]?.[tileX] !== 1 || seen.has(key(tileX, tileY))) continue;
      seen.add(key(tileX, tileY));
      queue.push({ tileX, tileY });
    }
  }
  return false;
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

  it("Midutech (boss final) exige haber vencido a GenNvim en la FÁBRICA: la puerta post-jefe lo sella", () => {
    const approach = { tileX: 26, tileY: 5 }; // casilla contigua (debajo) de Midutech (26,4)
    // Con la compuerta abierta pero sin haber vencido a GenNvim (duel-10), la puerta post-jefe sella a Midutech.
    const beforeBoss = contextFor({ completed: [DUEL_1, DUEL_5] });
    expect(findGridPath(spawnTile(beforeBoss.tilemap), approach, beforeBoss.context)).toBeNull();
    // GenNvim vencido en la Fábrica: se abre la puerta post-jefe -> Midutech alcanzable.
    const afterBoss = contextFor({ completed: [DUEL_1, DUEL_5, CARD_FORGE_DUEL_ID] });
    expect(findGridPath(spawnTile(afterBoss.tilemap), approach, afterBoss.context)).not.toBeNull();
  });

  it("GenNvim ya NO es jefe de la última sala: duel-6 no está en el mapa y Midutech es el único BOSS", () => {
    const objects = buildAct4OverworldTilemap().objects;
    expect(objects.some((object) => object.id === "story-ch4-duel-6")).toBe(false);
    expect(objects.filter((object) => object.kind === "BOSS").map((object) => object.id)).toEqual(["story-ch4-duel-7"]);
    // Su antigua casilla (26,9) queda como suelo libre de la antesala.
    expect(buildAct4OverworldTilemap().collision[9][26]).toBe(1);
  });

  it("el portal al Acto 5 existe SIN destino (aún no construido) y sólo tras vencer a Midutech", () => {
    const portal = buildAct4OverworldTilemap().objects.find((object) => object.id === ACT_5_PORTAL_ID)!;
    expect(portal.kind).toBe("WARP");
    expect(portal.warp).toBeUndefined(); // sin destino: la escena narra que el Acto 5 está en construcción
    expect(portal.gateRequiredNodeIds).toEqual(["story-ch4-duel-7"]);
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

  it("coloca los rivales del capítulo 4 (menos duel-6, que ya no se pelea en la sala del jefe)", () => {
    const objects = buildAct4OverworldTilemap().objects;
    const ids = new Set(objects.map((object) => object.id));
    for (const n of [1, 2, 3, 4, 5, 7, 8, 9, 10]) expect(ids.has(`story-ch4-duel-${n}`)).toBe(true);
    expect(ids.has("story-ch4-duel-6")).toBe(false);
    // duel-8 (guardián de la Hydra) es DUEL, no BOSS.
    expect(objects.find((object) => object.id === "story-ch4-duel-8")?.kind).toBe("DUEL");
    const postBossGate = objects.find((object) => object.id === "story-a4-gate-postboss")!;
    expect(postBossGate.gateRequiredNodeIds).toEqual([CARD_FORGE_DUEL_ID]);
  });

  it("la carta HYDRA exige vencer a duel-8: el nodo está gateado (ya no lo tapa el cuerpo del rival)", () => {
    // GenNvim pasó de guardia plantado a EMBOSCADA por cutscene: su casilla ya no bloquea el pasillo, así
    // que el candado de la carta es el gate del nodo (y el trigger que fuerza el combate al acercarse).
    const tilemap = buildAct4OverworldTilemap();
    const hydra = tilemap.objects.find((object) => object.id === "story-ch4-card-hydra")!;
    expect(hydra.gateRequiredNodeIds).toEqual([DUEL_8]);
  });

  it("duel-8 (GenNvim) es un rival de emboscada: oculto, sin visión y sin ocupar el pasillo", () => {
    const tilemap = buildAct4OverworldTilemap();
    const duel8 = tilemap.objects.find((object) => object.id === DUEL_8)!;
    // Oculto (ni token ni minimapa) y sin visionRange → el motor no crea actor: solo aparece en la cutscene.
    expect(duel8.hidden).toBe(true);
    expect(duel8.visionRange).toBeUndefined();
    // Su casilla nominal (el acceso al callejón de la Hydra) es transitable: el pasillo está despejado.
    expect(tilemap.collision[duel8.tileY][duel8.tileX]).toBe(1);
    // Sigue siendo la celda contigua a la carta (desde ahí se recoge).
    const hydra = tilemap.objects.find((object) => object.id === "story-ch4-card-hydra")!;
    expect(Math.abs(duel8.tileX - hydra.tileX) + Math.abs(duel8.tileY - hydra.tileY)).toBe(1);
  });

  it("el trigger de la emboscada está DOS casillas antes del acceso a la carta, en el pasillo", () => {
    const tilemap = buildAct4OverworldTilemap();
    const trigger = tilemap.objects.find((object) => object.id === HYDRA_AMBUSH_TRIGGER_ID)!;
    const duel8 = tilemap.objects.find((object) => object.id === DUEL_8)!;
    expect(trigger.trigger).toBe("STEP_ON");
    expect(trigger.hidden).toBe(true);
    const corridor = traceWalkableCorridor(
      tilemap.collision,
      { tileX: duel8.tileX, tileY: duel8.tileY },
      { tileX: trigger.tileX, tileY: trigger.tileY },
    );
    // [acceso, +1, +2]: se pisa a dos pasos de poder coger la carta.
    expect(corridor).toHaveLength(HYDRA_AMBUSH_TILES_BEFORE_CARD + 1);
  });

  it("el maze de la Hydra sigue exigiendo vencer al guardia de su entrada (duel-4)", () => {
    // La emboscada no abre un atajo: la puerta del maze leftUp la sigue tapando duel-4.
    const tilemap = buildAct4OverworldTilemap();
    const duel8 = tilemap.objects.find((object) => object.id === DUEL_8)!;
    const target = { tileX: duel8.tileX, tileY: duel8.tileY };
    const locked = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(locked.tilemap), target, locked.context)).toBeNull();
    const cleared = contextFor({ completed: [DUEL_1, DUEL_4] });
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
    // Interruptor de ABAJO (fondo del maze rightUp) e interruptor de ARRIBA (terminal): mismo beltToggleRect.
    const bottom = tilemap.objects.find((object) => object.id === SWITCH_ID)!;
    const top = tilemap.objects.find((object) => object.id === SWITCH_TOP_ID)!;
    expect(bottom.kind).toBe("SWITCH");
    expect(top.kind).toBe("SWITCH");
    expect(bottom.beltToggleRect).toEqual(rect);
    expect(top.beltToggleRect).toEqual(rect);
    // Dos posiciones de la MISMA palanca: el de abajo invierte (subir), el de arriba restaura (bajar). Nunca
    // pueden quedar los dos encendidos ni los dos apagados.
    expect(bottom.beltToggleMode).toBe("INVERT");
    expect(top.beltToggleMode).toBe("RESTORE");
    // El de arriba está en el terminal (y<=21) para poder revertir la cinta y bajar; el de abajo vive DENTRO del
    // laberinto de la sala derecha alta (x>=38, y=25..33), que deja así de ser una sala opcional de adorno.
    expect(top.tileY).toBeLessThanOrEqual(21);
    expect(bottom.tileX).toBeGreaterThanOrEqual(38);
    expect(bottom.tileY).toBeGreaterThanOrEqual(25);
    expect(bottom.tileY).toBeLessThanOrEqual(33);
  });

  it("el interruptor del maze rightUp está al FONDO del todo y lo guarda duel-5", () => {
    const tilemap = buildAct4OverworldTilemap();
    const bottom = tilemap.objects.find((object) => object.id === SWITCH_ID)!;
    const guard = tilemap.objects.find((object) => object.id === DUEL_5)!;
    // Escondido: es el callejón MÁS LEJANO de la boca del maze (38,29), no el primero que aparece al barrer.
    // El interruptor y su guardia son sólidos (se usan desde el lado), así que se miden sobre una copia de la
    // rejilla con esas dos celdas abiertas.
    const walkable = tilemap.collision.map((row) => [...row]);
    walkable[bottom.tileY][bottom.tileX] = 1;
    walkable[guard.tileY][guard.tileX] = 1;
    const fromEntry = traceWalkableCorridor(walkable, { tileX: 38, tileY: 29 }, { tileX: bottom.tileX, tileY: bottom.tileY });
    expect(fromEntry.length).toBeGreaterThanOrEqual(6);
    // El centinela ocupa la ÚNICA casilla contigua al interruptor (su acceso).
    expect(Math.abs(guard.tileX - bottom.tileX) + Math.abs(guard.tileY - bottom.tileY)).toBe(1);
    expect(guard.tileX).toBeGreaterThanOrEqual(38); // dentro del maze rightUp
    // Sin vencer a duel-5 no se llega al interruptor; venciéndolo, sí (su casilla se libera).
    const locked = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(locked.tilemap), { tileX: guard.tileX, tileY: guard.tileY }, locked.context)).toBeNull();
    const cleared = contextFor({ completed: [DUEL_1, DUEL_5] });
    expect(findGridPath(spawnTile(cleared.tilemap), { tileX: guard.tileX, tileY: guard.tileY }, cleared.context)).not.toBeNull();
  });

  it("duel-9 patrulla el laberinto 1 en vertical y su recorrido sale del nicho al corredor", () => {
    const tilemap = buildAct4OverworldTilemap();
    const sentinel = tilemap.objects.find((object) => object.id === DUEL_9)!;
    expect(sentinel.kind).toBe("DUEL");
    expect(sentinel.patrolAxis).toBe("V");
    expect(sentinel.patrolLength).toBeGreaterThan(0);
    expect(sentinel.patrolSweep).toBe(true);
    expect(sentinel.visionRange).toBeGreaterThan(0);
    // Dentro del cuerpo del laberinto 1 (y=46..58, x=18..34).
    expect(sentinel.tileY).toBeGreaterThanOrEqual(46);
    expect(sentinel.tileY).toBeLessThanOrEqual(58);
    expect(sentinel.tileX).toBeGreaterThanOrEqual(18);
    expect(sentinel.tileX).toBeLessThanOrEqual(34);
    // Todo su recorrido (origen..origen+length) es suelo transitable: si no, rebotaría contra un muro.
    for (let offset = 0; offset <= sentinel.patrolLength!; offset++) {
      expect(tilemap.collision[sentinel.tileY + offset][sentinel.tileX]).toBe(1);
    }
  });

  it("el centinela NO sella el laberinto: no ocupa casilla (si la ocupara, la salida quedaría aislada)", () => {
    const tilemap = buildAct4OverworldTilemap();
    const sentinel = tilemap.objects.find((object) => object.id === DUEL_9)!;
    const exitTile = { tileX: 26, tileY: 44 }; // corredor laberinto 1 -> laberinto 2
    // 1) Con el centinela vivo (sin vencerlo) la salida del laberinto sigue siendo alcanzable.
    const alive = contextFor({ completed: [DUEL_1] });
    expect(findGridPath(spawnTile(alive.tilemap), exitTile, alive.context)).not.toBeNull();
    // 2) Y esta es la razón por la que NO se le marca como sólido: su casilla del corredor es ruta única dentro
    //    del laberinto, así que un cuerpo ahí cortaría el paso a la salida. El assert deja constancia del porqué.
    const mazeEntry = { tileX: 26, tileY: 59 }; // boca del laberinto 1, ya pasado duel-1
    expect(isReachableWithBlockedTile(tilemap, mazeEntry, exitTile, { tileX: 0, tileY: 0 })).toBe(true);
    expect(
      isReachableWithBlockedTile(tilemap, mazeEntry, exitTile, { tileX: sentinel.tileX, tileY: sentinel.tileY }),
    ).toBe(false);
  });

  it("la FÁBRICA DE CARTAS preside la mitad ALTA del terminal (fuera del laberinto), con los villanos debajo", () => {
    const tilemap = buildAct4OverworldTilemap();
    // Las dos casillas de los villanos son suelo contiguo (hombro con hombro) y están FUERA del medio laberinto
    // (y <= 15), en la nave abierta del terminal.
    for (const villain of [CARD_FORGE_GENNVIM_TILE, CARD_FORGE_MIDUTECH_TILE]) {
      expect(tilemap.collision[villain.tileY][villain.tileX]).toBe(1);
      expect(villain.tileY).toBeLessThanOrEqual(15);
    }
    expect(Math.abs(CARD_FORGE_GENNVIM_TILE.tileX - CARD_FORGE_MIDUTECH_TILE.tileX)).toBe(1);
    // La MÁQUINA son las dos mitades del mismo chasis, justo encima de ellos y sólidas (no se pisan).
    const machineY = CARD_FORGE_GENNVIM_TILE.tileY - 1;
    expect(tilemap.layers.overlay[machineY][CARD_FORGE_MIDUTECH_TILE.tileX]).toBe(OVERLAY_TILE.CARD_FORGE);
    expect(tilemap.layers.overlay[machineY][CARD_FORGE_GENNVIM_TILE.tileX]).toBe(OVERLAY_TILE.CARD_FORGE_RIGHT);
    for (const tileX of [CARD_FORGE_GENNVIM_TILE.tileX, CARD_FORGE_MIDUTECH_TILE.tileX]) {
      expect(tilemap.collision[machineY][tileX]).toBe(0);
    }
    // No tapona el paso a la compuerta del jefe (x=26): la ruta hacia arriba sigue libre.
    expect(tilemap.collision[machineY][26]).toBe(1);
  });

  it("la escena de la Fábrica es OBLIGATORIA: su trigger es la única boca de salida del medio laberinto", () => {
    const tilemap = buildAct4OverworldTilemap();
    const trigger = tilemap.objects.find((object) => object.id === CARD_FORGE_TRIGGER_ID)!;
    expect(trigger.trigger).toBe("STEP_ON");
    expect(trigger.hidden).toBe(true);
    // Sin pisar el trigger no se sale del medio laberinto hacia la mitad alta (ni, por tanto, al jefe).
    const beltArrival = { tileX: 26, tileY: 21 }; // donde te deja la cinta del puente
    const upperHalf = { tileX: 26, tileY: 13 }; // mitad alta del terminal (camino a la compuerta del jefe)
    expect(isReachableWithBlockedTile(tilemap, beltArrival, upperHalf, { tileX: -1, tileY: -1 })).toBe(true);
    expect(
      isReachableWithBlockedTile(tilemap, beltArrival, upperHalf, { tileX: trigger.tileX, tileY: trigger.tileY }),
    ).toBe(false);
    // Y la cámara de la Fábrica queda a tiro de vista del trigger (si no, la escena arrancaría fuera de cámara).
    const toVillains = traceWalkableCorridor(
      tilemap.collision,
      { tileX: trigger.tileX, tileY: trigger.tileY },
      { tileX: CARD_FORGE_GENNVIM_TILE.tileX, tileY: CARD_FORGE_GENNVIM_TILE.tileY },
    );
    expect(toVillains.length).toBeGreaterThan(1);
    expect(toVillains.length).toBeLessThanOrEqual(CARD_FORGE_MAX_TILES_FROM_MACHINE);
  });

  it("los dos villanos son ATREZZO visible antes de la escena (no aparecen de la nada)", () => {
    const tilemap = buildAct4OverworldTilemap();
    const scenery = [
      { id: CARD_FORGE_SCENERY_GENNVIM_ID, tile: CARD_FORGE_GENNVIM_TILE },
      { id: CARD_FORGE_SCENERY_MIDUTECH_ID, tile: CARD_FORGE_MIDUTECH_TILE },
    ];
    for (const { id, tile } of scenery) {
      const object = tilemap.objects.find((entry) => entry.id === id)!;
      expect(object.kind).toBe("NPC");
      expect(object.hidden).toBeUndefined(); // se dibujan desde que asomas a la sala
      expect(object.imageSrc).toBeTruthy();
      expect({ tileX: object.tileX, tileY: object.tileY }).toEqual({ tileX: tile.tileX, tileY: tile.tileY });
      // NO son sólidos: los NPCs guionizados de la cutscene recorren esas casillas.
      expect(tilemap.collision[object.tileY][object.tileX]).toBe(1);
    }
  });

  it("duel-10 (GenNvim en la Fábrica) es un rival de escena: oculto, sin visión y sin ocupar casilla", () => {
    const tilemap = buildAct4OverworldTilemap();
    const duel10 = tilemap.objects.find((object) => object.id === CARD_FORGE_DUEL_ID)!;
    expect(duel10.kind).toBe("DUEL");
    expect(duel10.hidden).toBe(true);
    expect(duel10.visionRange).toBeUndefined();
    expect(tilemap.collision[duel10.tileY][duel10.tileX]).toBe(1);
  });

  it("el interruptor gemelo sigue accesible en la mitad alta y la consola E4 ya no existe", () => {
    const tilemap = buildAct4OverworldTilemap();
    // El gemelo evita el soft-lock de la cinta: no puede haber quedado sepultado bajo el maze (y=16..21).
    const top = tilemap.objects.find((entry) => entry.id === SWITCH_TOP_ID)!;
    expect(top.tileY).toBeLessThanOrEqual(15);
    expect(approachOf(tilemap, top)).not.toBeNull();
    // La consola "registro-madre" se retiró: su revelación la cuenta la escena de la Fábrica.
    expect(tilemap.objects.some((entry) => entry.id === "story-ch4-event-revelation")).toBe(false);
    expect(findStoryVirtualNodeDefinition("story-ch4-event-revelation")).toBeNull();
  });

  it("la pasarela ya no narra nada y la sala derecha alta no tiene consola de evento", () => {
    // B.1/B.2: se borraron el aviso de la pasarela (story-ch4-event-belt-locked) y la consola placeholder de
    // rightUp (story-ch4-event-rightup), que quedó sustituida por el interruptor.
    const ids = new Set(buildAct4OverworldTilemap().objects.map((object) => object.id));
    expect(ids.has("story-ch4-event-belt-locked")).toBe(false);
    expect(ids.has("story-ch4-event-rightup")).toBe(false);
    expect(findStoryVirtualNodeDefinition("story-ch4-event-belt-locked")).toBeNull();
    expect(findStoryVirtualNodeDefinition("story-ch4-event-rightup")).toBeNull();
  });
});

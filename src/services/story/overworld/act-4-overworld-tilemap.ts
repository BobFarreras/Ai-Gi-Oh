// src/services/story/overworld/act-4-overworld-tilemap.ts - Acto 4 "Núcleo GenNvim": mainframe de estética
// TERMINAL (verde fósforo). FASE 1 = esqueleto navegable: 3 franjas verticales (entrada → hub → laberinto →
// salas altas → jefe) con salas, corredores, spawn, servicios y warp de retorno al Acto 3. Rivales, puzzles
// (cajas + cintas), puertas por victoria y objetos llegan en fases posteriores.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 52;
const MAP_HEIGHT = 56;

// Avatares (ya existen en assets). GenNvim reutiliza el del apprentice; Midutech el del oponente de arena.
const SOLDADO = "/assets/story/opponents/opp-ch4-soldado-terminal/avatar-Soldado-terminal.webp";
const GENNVIM = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
const MIDUTECH = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";

interface IMutableTilemap {
  ground: number[][];
  overlay: number[][];
  collision: number[][];
}
interface IRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** El vacío del núcleo es abismo digital no transitable; las salas flotan sobre él. */
function buildVoidLayers(): IMutableTilemap {
  return {
    ground: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => GROUND_TILE.WATER as number)),
    overlay: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
    collision: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
  };
}

function fillRoom(map: IMutableTilemap, rect: IRect): void {
  for (let tileY = rect.y0; tileY <= rect.y1; tileY++) {
    for (let tileX = rect.x0; tileX <= rect.x1; tileX++) {
      map.ground[tileY][tileX] = GROUND_TILE.SAND;
      map.collision[tileY][tileX] = 1;
    }
  }
}

/** Corredor recto de 1 casilla (única conexión entre salas = barrera real más adelante). */
function carveCorridor(map: IMutableTilemap, from: { x: number; y: number }, to: { x: number; y: number }): void {
  if (from.x === to.x) {
    for (let tileY = Math.min(from.y, to.y); tileY <= Math.max(from.y, to.y); tileY++) {
      map.ground[tileY][from.x] = GROUND_TILE.PATH;
      map.collision[tileY][from.x] = 1;
    }
  } else {
    for (let tileX = Math.min(from.x, to.x); tileX <= Math.max(from.x, to.x); tileX++) {
      map.ground[from.y][tileX] = GROUND_TILE.PATH;
      map.collision[from.y][tileX] = 1;
    }
  }
}

function placeStructure(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.overlay[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 0;
}

/** Convierte una casilla en cinta transportadora (arrastra al jugador en la dirección dada). */
function placeBelt(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.ground[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 1;
}

/** Marca la casilla de un servicio/rival como sólida (obstáculo con el que se interactúa desde el lado). */
function markSolid(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (map.collision[tileY]?.[tileX] !== 1) {
    throw new Error(`act-4-overworld: casilla (${tileX}, ${tileY}) debería estar sobre suelo transitable.`);
  }
  map.collision[tileY][tileX] = 0;
}

/**
 * Acto 4 (esqueleto): entrada (servicios + retorno) -> hub -> [ramas izquierda/derecha] -> laberinto central
 * -> salas altas (registro / terminal / caché) -> sala del jefe. Todo caminable de punta a punta (aún sin
 * gates), para validar el trazado y estrenar el ambiente verde TERMINAL.
 */
export function buildAct4OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntry: IRect = { x0: 20, y0: 47, x1: 32, y1: 53 };
  const roomHub: IRect = { x0: 20, y0: 37, x1: 32, y1: 44 };
  const roomLeftLow: IRect = { x0: 4, y0: 37, x1: 15, y1: 44 };
  const roomRightLow: IRect = { x0: 37, y0: 37, x1: 48, y1: 44 };
  const roomLab: IRect = { x0: 18, y0: 25, x1: 34, y1: 34 };
  const roomLeftUp: IRect = { x0: 4, y0: 25, x1: 14, y1: 33 };
  const roomRightUp: IRect = { x0: 38, y0: 25, x1: 48, y1: 33 };
  const roomTerminal: IRect = { x0: 20, y0: 13, x1: 32, y1: 21 };
  const roomBoss: IRect = { x0: 18, y0: 3, x1: 34, y1: 11 };
  for (const room of [roomEntry, roomHub, roomLeftLow, roomRightLow, roomLab, roomLeftUp, roomRightUp, roomTerminal, roomBoss]) {
    fillRoom(map, room);
  }

  // Corredores (1 casilla). Espina central: entrada -> hub -> laberinto -> terminal -> jefe.
  carveCorridor(map, { x: 26, y: 45 }, { x: 26, y: 46 }); // entrada -> hub
  carveCorridor(map, { x: 26, y: 35 }, { x: 26, y: 36 }); // hub -> laberinto
  carveCorridor(map, { x: 26, y: 22 }, { x: 26, y: 24 }); // laberinto -> terminal
  carveCorridor(map, { x: 26, y: 12 }, { x: 26, y: 12 }); // terminal -> jefe
  // Ramas bajas (izquierda / derecha) desde el hub.
  carveCorridor(map, { x: 16, y: 40 }, { x: 19, y: 40 }); // hub -> rama izq baja
  carveCorridor(map, { x: 33, y: 40 }, { x: 36, y: 40 }); // hub -> rama der baja
  // Ramas altas (recompensas) desde las ramas bajas y desde el laberinto.
  carveCorridor(map, { x: 9, y: 34 }, { x: 9, y: 36 }); // rama izq baja -> sala izq alta
  carveCorridor(map, { x: 43, y: 34 }, { x: 43, y: 36 }); // rama der baja -> sala der alta
  carveCorridor(map, { x: 15, y: 29 }, { x: 17, y: 29 }); // laberinto <-> sala izq alta
  carveCorridor(map, { x: 35, y: 29 }, { x: 37, y: 29 }); // laberinto <-> sala der alta

  // Laberinto (Fase 2): cinta de ascenso en el lado derecho del laberinto (un solo sentido: se sube por ella
  // y se baja por el suelo abierto de al lado, así que no atrapa). Da sabor de "pasarela" a la sala.
  for (const y of [28, 29, 30, 31, 32]) placeBelt(map, 31, y, GROUND_TILE.BELT_UP);

  // Puente lab -> terminal: cinta EN CONTRA (empuja hacia abajo). No se sube hasta invertir su sentido con el
  // botón de la rama derecha alta (belt-toggle). El botón se marca sólido (se usa desde el lado).
  for (const y of [22, 23, 24]) placeBelt(map, 26, y, GROUND_TILE.BELT_DOWN);
  markSolid(map, 43, 29); // botón que invierte la cinta del puente

  // Estructuras decorativas variadas (racks + unidades de refrigeración + pilones) en esquinas que no estorban.
  const racks: Array<[number, number]> = [[20, 53], [32, 53], [4, 44], [48, 37], [4, 25], [48, 33]];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  const coolers: Array<[number, number]> = [[20, 37], [37, 44], [14, 33], [18, 25]];
  for (const [x, y] of coolers) placeStructure(map, x, y, OVERLAY_TILE.COOLING_UNIT);
  const pylons: Array<[number, number]> = [[32, 44], [15, 37], [38, 25], [34, 34]];
  for (const [x, y] of pylons) placeStructure(map, x, y, OVERLAY_TILE.DATA_PYLON);
  for (const [x, y] of [[18, 3], [34, 3]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }

  // Servicios (sólidos, se usan desde la casilla contigua) + retorno al Acto 3 (se pisa, sobre suelo).
  markSolid(map, 23, 52); // market
  markSolid(map, 25, 52); // arsenal
  markSolid(map, 30, 52); // teleport (salir)
  markSolid(map, 32, 33); // botón de reinicio de cajas (rescate anti soft-lock)

  // Rivales (sólidos): al vencerlos se teletransportan y liberan su casilla.
  markSolid(map, 26, 46); // duel-1 Soldado-Terminal (corredor de entrada, chokepoint único)
  markSolid(map, 17, 40); // duel-2 (rama izquierda baja)
  markSolid(map, 36, 29); // duel-3 (acceso a la rama derecha alta / botón de la cinta)
  markSolid(map, 16, 29); // duel-4 (rama izquierda alta)
  markSolid(map, 30, 17); // duel-5 (guardia del terminal)
  markSolid(map, 26, 9); // duel-6 GenNvim (boss 1, mitad baja de la sala del jefe)
  markSolid(map, 26, 4); // duel-7 Midutech (boss final, mitad alta, tras la puerta post-jefe)
  // Muro de atrezzo que parte la sala del jefe en dos; hueco en x=26 con la puerta post-GenNvim.
  for (let x = 18; x <= 34; x++) if (x !== 26) placeStructure(map, x, 6, OVERLAY_TILE.SERVER_RACK);

  return validateOverworldTilemap({
    schemaVersion: 2,
    id: "act-4",
    act: 4,
    ambient: "TERMINAL",
    tileSize: 52,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      // ── Servicios + retorno ───────────────────────────────────────────────
      { id: "story-a4-market", kind: "MARKET", tileX: 23, tileY: 52, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-arsenal", kind: "ARSENAL", tileX: 25, tileY: 52, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-teleport-hub", kind: "TELEPORT", tileX: 30, tileY: 52, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Retorno al Acto 3 (se pisa). El avance al Acto 5 se añadirá con el jefe (Acto 5 = "próximamente").
      { id: "story-ch4-transition-to-act3", kind: "WARP", tileX: 20, tileY: 50, sprite: "portal", trigger: "STEP_ON", warp: { toMapId: "act-3", toSpawnId: "spawn-entry", direction: "backward" } },

      // ── Laberinto: puzzle 1 = caja empujable + placa → compuerta terminal→jefe ─────────────────────
      // Empuja la caja sobre la placa para abrir la compuerta del tramo alto (terminal -> jefe).
      { id: "story-ch4-box-lab", kind: "BOX", tileX: 24, tileY: 31, sprite: "box", trigger: "ADJACENT_ACTION" },
      { id: "story-ch4-plate-lab", kind: "PLATE", tileX: 21, tileY: 31, sprite: "plate", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-gate-boss", kind: "GATE", tileX: 26, tileY: 12, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-plate-lab"] },
      // Botón de rescate: si la caja se empotra contra una pared, la devuelve a su sitio.
      { id: "story-a4-box-reset", kind: "BOX_RESET", tileX: 32, tileY: 33, sprite: "reset", trigger: "ADJACENT_ACTION" },

      // ── Laberinto: puzzle 2 = botón que INVIERTE la cinta del puente lab->terminal (belt-toggle) ────
      // Está en la rama derecha alta (otra sala); al accionarlo, la cinta del puente pasa de bajar a subir.
      { id: "story-ch4-belt-button", kind: "SWITCH", tileX: 43, tileY: 29, sprite: "switch", trigger: "ADJACENT_ACTION", beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 } },

      // ── Rivales (ids reales del capítulo 4; duelHref -> /hub/story/chapter/4/duel/N) ─────────────────
      // 1-5: Soldado-Terminal (centinelas). 6: GenNvim (boss 1). 7: Midutech (boss final).
      { id: "story-ch4-duel-1", kind: "DUEL", tileX: 26, tileY: 46, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/1", imageSrc: SOLDADO, facing: "UP", visionRange: 3 },
      { id: "story-ch4-duel-2", kind: "DUEL", tileX: 17, tileY: 40, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/2", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-3", kind: "DUEL", tileX: 36, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/3", imageSrc: SOLDADO, facing: "LEFT", visionRange: 3, patrolAxis: "V", patrolLength: 2, patrolSweep: true },
      { id: "story-ch4-duel-4", kind: "DUEL", tileX: 16, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/4", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-5", kind: "DUEL", tileX: 30, tileY: 17, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/5", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-6", kind: "BOSS", tileX: 26, tileY: 9, sprite: "gennvim", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/6", imageSrc: GENNVIM, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 7, x1: 34, y1: 11 } },
      { id: "story-ch4-duel-7", kind: "BOSS", tileX: 26, tileY: 4, sprite: "midutech", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/7", imageSrc: MIDUTECH, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 3, x1: 34, y1: 5 } },

      // ── Puerta post-GenNvim: SOLO abre tras vencer a GenNvim (duel-6); sella a Midutech ──────────────
      { id: "story-a4-gate-postboss", kind: "GATE", tileX: 26, tileY: 6, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-6"] },
    ],
    spawns: [{ id: "spawn-entry", tileX: 26, tileY: 51, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

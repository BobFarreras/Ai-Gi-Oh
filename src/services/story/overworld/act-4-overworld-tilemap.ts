// src/services/story/overworld/act-4-overworld-tilemap.ts - Acto 4 "Núcleo GenNvim": mainframe de estética
// TERMINAL (verde fósforo). FASE 1 = esqueleto navegable: 3 franjas verticales (entrada → hub → laberinto →
// salas altas → jefe) con salas, corredores, spawn, servicios y warp de retorno al Acto 3. Rivales, puzzles
// (cajas + cintas), puertas por victoria y objetos llegan en fases posteriores.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 52;
const MAP_HEIGHT = 64;

// Avatares (ya existen en assets). GenNvim reutiliza el del apprentice; Midutech el del oponente de arena.
const SOLDADO = "/assets/story/opponents/opp-ch4-soldado-terminal/avatar-Soldado-terminal.webp";
const GENNVIM = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
const MIDUTECH = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";
// Objetos de recompensa (arte ya existente en /assets/items/).
const USB = "/assets/items/candy-usb-raro.webp";
const ATK_AUGMENT = "/assets/items/item-nucleo-overclock.webp";
const DEF_AUGMENT = "/assets/items/item-placa-blindada.webp";

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

  const roomEntry: IRect = { x0: 20, y0: 55, x1: 32, y1: 61 };
  const roomHub: IRect = { x0: 20, y0: 45, x1: 32, y1: 52 };
  const roomLeftLow: IRect = { x0: 4, y0: 45, x1: 15, y1: 52 };
  const roomRightLow: IRect = { x0: 37, y0: 45, x1: 48, y1: 52 };
  const roomLab: IRect = { x0: 18, y0: 25, x1: 34, y1: 42 }; // laberinto largo (18 filas) para la serpiente
  const roomLeftUp: IRect = { x0: 4, y0: 25, x1: 14, y1: 33 };
  const roomRightUp: IRect = { x0: 38, y0: 25, x1: 48, y1: 33 };
  const roomTerminal: IRect = { x0: 20, y0: 13, x1: 32, y1: 21 };
  const roomBoss: IRect = { x0: 18, y0: 3, x1: 34, y1: 11 };
  for (const room of [roomEntry, roomHub, roomLeftLow, roomRightLow, roomLab, roomLeftUp, roomRightUp, roomTerminal, roomBoss]) {
    fillRoom(map, room);
  }

  // Corredores (1 casilla). Espina central: entrada -> hub -> laberinto -> terminal -> jefe.
  carveCorridor(map, { x: 26, y: 53 }, { x: 26, y: 54 }); // entrada -> hub
  carveCorridor(map, { x: 26, y: 43 }, { x: 26, y: 44 }); // hub -> laberinto
  carveCorridor(map, { x: 26, y: 22 }, { x: 26, y: 24 }); // laberinto -> terminal
  carveCorridor(map, { x: 26, y: 12 }, { x: 26, y: 12 }); // terminal -> jefe
  // Ramas bajas (izquierda / derecha) desde el hub.
  carveCorridor(map, { x: 16, y: 48 }, { x: 19, y: 48 }); // hub -> rama izq baja
  carveCorridor(map, { x: 33, y: 48 }, { x: 36, y: 48 }); // hub -> rama der baja
  // Ramas altas SOLO desde el laberinto (las ramas bajas quedan selladas): así sus rivales-guardia son
  // OBLIGATORIOS — no se llega al aumento de DEF ni al botón de la cinta sin vencerlos.
  carveCorridor(map, { x: 15, y: 29 }, { x: 17, y: 29 }); // laberinto -> sala izq alta (aumento DEF, guardia duel-4)
  carveCorridor(map, { x: 35, y: 29 }, { x: 37, y: 29 }); // laberinto -> sala der alta (botón cinta, guardia duel-3)

  // Laberinto SERPENTEANTE de SERVIDORES (calcado del diseño de referencia): 8 bandas horizontales de racks que
  // cruzan la sala dejando UNA sola abertura que ALTERNA de lado en cada banda -> pasillos de 1 casilla que
  // obligan a zigzaguear de la entrada (abajo, x=26) hasta la salida (arriba, x=26). La franja y=29 queda abierta:
  // es la fila central con las salidas laterales (izq aumento DEF / der botón) y el USB de camino.
  const wallRow = (rowY: number, x0: number, x1: number): void => {
    for (let x = x0; x <= x1; x++) placeStructure(map, x, rowY, OVERLAY_TILE.SERVER_RACK);
  };
  // Embudo de salida: y=26 solo tiene hueco en x=26, TAPADO por el módulo (caja) en (26,27). No se sube al puente
  // sin apartar la caja; y apartarla a su RANURA (22,27) invierte la pasarela de forma PERMANENTE (anti soft-lock).
  wallRow(26, 18, 25);
  wallRow(26, 27, 34);
  // y=27 abierta: fila del MÓDULO + RANURA. Bandas alternas hacia abajo (der/izq/der/izq/der/izq/der):
  wallRow(28, 18, 31); // hueco DERECHA (x=32..34): se llega a la fila del módulo por la derecha
  // y=29 abierta (fila central: salidas laterales + USB)
  wallRow(30, 21, 34); // hueco IZQUIERDA (x=18..20)
  wallRow(32, 18, 31); // hueco DERECHA
  wallRow(34, 21, 34); // hueco IZQUIERDA
  wallRow(36, 18, 31); // hueco DERECHA
  wallRow(38, 21, 34); // hueco IZQUIERDA
  wallRow(40, 18, 31); // hueco DERECHA (la entrada por x=26 obliga a rodear a la derecha desde la primera banda)

  // Puente lab -> terminal: cinta EN CONTRA (empuja hacia abajo). No se sube hasta insertar el módulo en la
  // ranura (belt-toggle sobre la placa): al hacerlo, la pasarela se invierte y queda fija (onPlatePressed la
  // enclava permanentemente), así que aunque la caja se mueva/resetee después no hay soft-lock.
  for (const y of [22, 23, 24]) placeBelt(map, 26, y, GROUND_TILE.BELT_DOWN);

  // Estructuras decorativas (racks + refrigeración + pilones) en esquinas de las salas que no estorban el paso.
  const racks: Array<[number, number]> = [[20, 61], [32, 61], [4, 52], [48, 45], [4, 25], [48, 33]];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  const coolers: Array<[number, number]> = [[20, 45], [37, 52], [14, 33], [18, 25]];
  for (const [x, y] of coolers) placeStructure(map, x, y, OVERLAY_TILE.COOLING_UNIT);
  const pylons: Array<[number, number]> = [[32, 52], [15, 45], [38, 25], [20, 13]];
  for (const [x, y] of pylons) placeStructure(map, x, y, OVERLAY_TILE.DATA_PYLON);
  for (const [x, y] of [[18, 3], [34, 3]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }

  // Servicios (sólidos, se usan desde la casilla contigua) + retorno al Acto 3 (se pisa, sobre suelo).
  markSolid(map, 23, 60); // market
  markSolid(map, 25, 60); // arsenal
  markSolid(map, 30, 60); // teleport (salir)
  markSolid(map, 18, 41); // botón de reinicio de cajas (rescate anti soft-lock, esquina de la entrada al lab)

  // Recompensas-objeto (se recogen pulsando al lado): USB en el laberinto; aumentos ATK/DEF en salas guardadas.
  markSolid(map, 34, 37); // USB Raro (recoveco de borde del laberinto: detour, no tapa el pasillo)
  markSolid(map, 7, 49); // aumento de ATAQUE (rama izq baja, tras el guardia duel-2)
  markSolid(map, 7, 29); // aumento de DEFENSA (rama izq alta, tras el guardia duel-4)

  // Rivales (sólidos): al vencerlos se teletransportan y liberan su casilla.
  markSolid(map, 26, 54); // duel-1 Soldado-Terminal (corredor de entrada, chokepoint único)
  markSolid(map, 17, 48); // duel-2 (rama izquierda baja)
  markSolid(map, 36, 29); // duel-3 (acceso a la rama derecha alta / botón de la cinta)
  markSolid(map, 16, 29); // duel-4 (rama izquierda alta)
  markSolid(map, 30, 17); // duel-5 (guardia del terminal)
  markSolid(map, 26, 9); // duel-6 GenNvim (boss 1, mitad baja de la sala del jefe)
  markSolid(map, 26, 4); // duel-7 Midutech (boss final, mitad alta, tras la puerta post-jefe)
  // Muro de atrezzo que parte la sala del jefe en dos; hueco en x=26 con la puerta post-GenNvim.
  for (let x = 18; x <= 34; x++) if (x !== 26) placeStructure(map, x, 6, OVERLAY_TILE.SERVER_RACK);

  // Consolas de eventos narrativos (se usan desde el lado).
  markSolid(map, 9, 29); // E2: log del origen (rama izquierda alta)
  markSolid(map, 24, 18); // E4: registro-madre (terminal)

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
      { id: "story-a4-market", kind: "MARKET", tileX: 23, tileY: 60, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-arsenal", kind: "ARSENAL", tileX: 25, tileY: 60, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-teleport-hub", kind: "TELEPORT", tileX: 30, tileY: 60, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Retorno al Acto 3 (se pisa). El avance al Acto 5 se añadirá con el jefe (Acto 5 = "próximamente").
      { id: "story-ch4-transition-to-act3", kind: "WARP", tileX: 20, tileY: 58, sprite: "portal", trigger: "STEP_ON", warp: { toMapId: "act-3", toSpawnId: "spawn-entry", direction: "backward" } },

      // ── Laberinto de servidores: el MÓDULO (caja) TAPA el embudo de salida en (26,27); la única forma de subir ──
      // es empujarlo a la izquierda por la fila y=27 hasta su RANURA (22,27), lo que invierte la pasarela del puente
      // de forma PERMANENTE (el jugador se topa con la cinta en contra y ha de volver a colocar el módulo).
      { id: "story-ch4-maze-box", kind: "BOX", tileX: 26, tileY: 27, sprite: "box", trigger: "ADJACENT_ACTION" },
      { id: "story-ch4-belt-slot", kind: "PLATE", tileX: 22, tileY: 27, sprite: "slot", trigger: "ADJACENT_ACTION", beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 } },
      // Botón de rescate: si la caja se empotra contra una pared, la devuelve a su sitio (anti soft-lock).
      { id: "story-a4-box-reset", kind: "BOX_RESET", tileX: 18, tileY: 41, sprite: "reset", trigger: "ADJACENT_ACTION" },
      // Compuerta terminal->jefe: requiere vencer al centinela de antesala (duel-5).
      { id: "story-a4-gate-boss", kind: "GATE", tileX: 26, tileY: 12, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-5"] },

      // ── Rivales (ids reales del capítulo 4; duelHref -> /hub/story/chapter/4/duel/N) ─────────────────
      // 1-5: Soldado-Terminal (centinelas). 6: GenNvim (boss 1). 7: Midutech (boss final).
      { id: "story-ch4-duel-1", kind: "DUEL", tileX: 26, tileY: 54, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/1", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-2", kind: "DUEL", tileX: 17, tileY: 48, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/2", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-3", kind: "DUEL", tileX: 36, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/3", imageSrc: SOLDADO, facing: "LEFT", visionRange: 3, patrolAxis: "V", patrolLength: 2, patrolSweep: true },
      { id: "story-ch4-duel-4", kind: "DUEL", tileX: 16, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/4", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-5", kind: "DUEL", tileX: 30, tileY: 17, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/5", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-6", kind: "BOSS", tileX: 26, tileY: 9, sprite: "gennvim", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/6", imageSrc: GENNVIM, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 7, x1: 34, y1: 11 } },
      { id: "story-ch4-duel-7", kind: "BOSS", tileX: 26, tileY: 4, sprite: "midutech", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/7", imageSrc: MIDUTECH, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 3, x1: 34, y1: 5 } },

      // ── Recompensas-objeto: USB en el laberinto + aumentos ATK/DEF tras rivales obligatorios ────────
      { id: "story-ch4-cache-usb", kind: "REWARD_OBJECT", tileX: 34, tileY: 37, sprite: "usb-raro", trigger: "ADJACENT_ACTION", imageSrc: USB },
      { id: "story-ch4-cache-atk", kind: "REWARD_OBJECT", tileX: 7, tileY: 49, sprite: "atk-augment", trigger: "ADJACENT_ACTION", imageSrc: ATK_AUGMENT },
      { id: "story-ch4-cache-def", kind: "REWARD_OBJECT", tileX: 7, tileY: 29, sprite: "def-augment", trigger: "ADJACENT_ACTION", imageSrc: DEF_AUGMENT },

      // ── Puerta post-GenNvim: SOLO abre tras vencer a GenNvim (duel-6); sella a Midutech ──────────────
      { id: "story-a4-gate-postboss", kind: "GATE", tileX: 26, tileY: 6, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-6"] },

      // ── Eventos narrativos ────────────────────────────────────────────────────────────────────────
      // Consolas (se leen pulsando al lado): E2 log del origen, E4 registro-madre.
      { id: "story-ch4-event-log-origin-1", kind: "EVENT", tileX: 9, tileY: 29, sprite: "console", trigger: "ADJACENT_ACTION" },
      { id: "story-ch4-event-revelation", kind: "EVENT", tileX: 24, tileY: 18, sprite: "console", trigger: "ADJACENT_ACTION" },
      // Triggers ocultos (se pisan, una vez): E3 al entrar al laberinto; belt-locked al llegar al puente en
      // contra; E5 tras vencer a GenNvim (celda naturalmente sellada por su casilla sólida); E6 tras Midutech.
      { id: "story-ch4-event-belts", kind: "EVENT", tileX: 26, tileY: 42, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-belt-locked", kind: "EVENT", tileX: 26, tileY: 25, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-pre-midutech", kind: "EVENT", tileX: 26, tileY: 7, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-core-key", kind: "EVENT", tileX: 26, tileY: 3, sprite: "hidden", trigger: "STEP_ON", hidden: true },
    ],
    spawns: [{ id: "spawn-entry", tileX: 26, tileY: 59, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

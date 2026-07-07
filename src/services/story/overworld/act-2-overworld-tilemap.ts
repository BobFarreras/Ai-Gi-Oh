// src/services/story/overworld/act-2-overworld-tilemap.ts - Acto 2 "Valle Visual": búnkeres fracturados sobre un abismo digital (agua), unidos por puentes de 1 casilla. Diseño distinto al Acto 1, mismo motor.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 36;
const MAP_HEIGHT = 34;

const SOLDIER = "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp";
const HELENA = "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp";
const BIGLOG = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";
const NEXUS = "/assets/renders/nexus.webp";
const SERVIDOR = "/assets/story/servidor-doc.webp";
const CARD_TOKEN = "/assets/renders/traps/trap-kernel-panic.webp";

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

/** El vacío del Acto 2 es un abismo de agua (no transitable): los búnkeres flotan sobre él. */
function buildVoidLayers(): IMutableTilemap {
  return {
    ground: Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => GROUND_TILE.WATER as number),
    ),
    overlay: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
    collision: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
  };
}

/** Suelo de búnker (panel técnico transitable). */
function fillRoom(map: IMutableTilemap, rect: IRect): void {
  for (let tileY = rect.y0; tileY <= rect.y1; tileY++) {
    for (let tileX = rect.x0; tileX <= rect.x1; tileX++) {
      map.ground[tileY][tileX] = GROUND_TILE.SAND;
      map.collision[tileY][tileX] = 1;
    }
  }
}

/** Puente recto de 1 casilla sobre el abismo (única conexión entre búnkeres = barrera real). */
function carveBridge(map: IMutableTilemap, from: { x: number; y: number }, to: { x: number; y: number }): void {
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

/** Estructura sólida (muro/pantalla/caja). No debe caer sobre puente ni haz de visión. */
function placeStructure(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.overlay[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 0;
}

/** Marca la casilla de un oponente/servicio como sólida (obstáculo con el que se interactúa). */
function markSolid(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (map.collision[tileY]?.[tileX] !== 1) {
    throw new Error(`act-2-overworld: casilla (${tileX}, ${tileY}) debería estar sobre suelo transitable.`);
  }
  map.collision[tileY][tileX] = 0;
}

/**
 * Acto 2: entrada (servicios) -> hub -> subruta de BigLog (obligatoria para el puente) y
 * ramas (izquierda Helena / derecha Soldado / centro) -> sala de jefe (Helena Núcleo) sellada
 * por una compuerta que exige vencer a BigLog, y portal al Acto 3 tras el jefe.
 */
export function buildAct2OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntry: IRect = { x0: 4, y0: 26, x1: 11, y1: 32 };
  const roomHub: IRect = { x0: 15, y0: 25, x1: 22, y1: 31 };
  const roomBigLog: IRect = { x0: 26, y0: 24, x1: 33, y1: 31 };
  const roomMid: IRect = { x0: 15, y0: 15, x1: 23, y1: 22 };
  const roomLeft: IRect = { x0: 4, y0: 14, x1: 11, y1: 22 };
  const roomRight: IRect = { x0: 26, y0: 14, x1: 33, y1: 21 };
  const roomBoss: IRect = { x0: 14, y0: 4, x1: 24, y1: 11 };
  for (const room of [roomEntry, roomHub, roomBigLog, roomMid, roomLeft, roomRight, roomBoss]) fillRoom(map, room);

  // Puentes de 1 casilla (únicas conexiones): entrada->hub->{bigLog, mid}, mid->{izq, der, jefe}, bigLog->der.
  carveBridge(map, { x: 12, y: 29 }, { x: 14, y: 29 }); // entrada -> hub
  carveBridge(map, { x: 23, y: 29 }, { x: 25, y: 29 }); // hub -> bigLog
  carveBridge(map, { x: 18, y: 24 }, { x: 18, y: 23 }); // hub -> mid
  carveBridge(map, { x: 12, y: 18 }, { x: 14, y: 18 }); // mid -> izquierda
  carveBridge(map, { x: 24, y: 18 }, { x: 25, y: 18 }); // mid -> derecha
  carveBridge(map, { x: 18, y: 14 }, { x: 18, y: 12 }); // mid -> jefe (con compuerta)
  carveBridge(map, { x: 29, y: 22 }, { x: 29, y: 23 }); // bigLog -> derecha
  carveBridge(map, { x: 19, y: 1 }, { x: 19, y: 3 }); // jefe -> portal Acto 3 (con compuerta)

  // Rivales y servicios (sólidos). Se marcan tras rellenar salas (no pisan puentes ni haces).
  for (const [x, y] of [[9, 16], [27, 16], [31, 18], [18, 20], [28, 25], [19, 15], [26, 27], [19, 7]]) {
    markSolid(map, x, y);
  }
  markSolid(map, 5, 28); // market
  markSolid(map, 7, 28); // arsenal
  markSolid(map, 10, 30); // teletransporte de salida
  // El portal de descenso (4,30) NO se marca sólido: un WARP debe estar sobre celda transitable.

  // Muros/pantallas para dar volumen a los búnkeres (no tocan puentes ni casillas de objeto).
  const racks: Array<[number, number]> = [
    [4, 26], [11, 26], [15, 31], [22, 25], [26, 24], [33, 31], [4, 22], [11, 14], [33, 14],
  ];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  for (const [x, y] of [[16, 4], [23, 4]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }
  for (const [x, y] of [[15, 22], [23, 15]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.CRATE);
  }

  return validateOverworldTilemap({
    schemaVersion: 1,
    id: "act-2",
    act: 2,
    tileSize: 52,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      // Servicios en el búnker de entrada (mismo diseño que el hub).
      { id: "story-a2-market", kind: "MARKET", tileX: 5, tileY: 28, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a2-arsenal", kind: "ARSENAL", tileX: 7, tileY: 28, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a2-teleport-hub", kind: "TELEPORT", tileX: 10, tileY: 30, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Portal de descenso al acto anterior (sin requisitos): para volver a explorar el Acto 1.
      { id: "story-ch2-transition-to-act1", kind: "WARP", tileX: 4, tileY: 30, sprite: "portal", trigger: "ADJACENT_ACTION", warp: { toMapId: "act-1", toSpawnId: "spawn-entry", direction: "backward" } },

      // Recompensas (se cogen al CHOCAR) y eventos, reutilizando los nodos virtuales reales del Acto 2.
      { id: "story-ch2-reward-nexus-a", kind: "REWARD_NEXUS", tileX: 18, tileY: 27, sprite: "nexus", trigger: "BUMP", imageSrc: NEXUS },
      { id: "story-ch2-event-core", kind: "EVENT", tileX: 16, tileY: 20, sprite: "servidor", trigger: "STEP_ON", imageSrc: SERVIDOR },
      { id: "story-ch2-reward-card-top", kind: "REWARD_CARD", tileX: 6, tileY: 16, sprite: "card", trigger: "BUMP", imageSrc: CARD_TOKEN },
      { id: "story-ch2-branch-center-a", kind: "REWARD_NEXUS", tileX: 21, tileY: 17, sprite: "nexus", trigger: "BUMP", imageSrc: NEXUS },
      { id: "story-ch2-branch-bottom-c", kind: "REWARD_NEXUS", tileX: 31, tileY: 16, sprite: "nexus", trigger: "BUMP", imageSrc: NEXUS },
      { id: "story-ch2-branch-lower-down-b", kind: "REWARD_NEXUS", tileX: 31, tileY: 26, sprite: "nexus", trigger: "BUMP", imageSrc: NEXUS },
      { id: "story-ch2-link-recovered-event", kind: "EVENT", tileX: 20, tileY: 19, sprite: "servidor", trigger: "STEP_ON", imageSrc: SERVIDOR },

      // Rivales con visión (estilo Pokémon). Mundo abierto: sin cadena entre duelos.
      { id: "story-ch2-duel-1", kind: "DUEL", tileX: 9, tileY: 16, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/1", imageSrc: HELENA, facing: "DOWN", visionRange: 3 },
      { id: "story-ch2-duel-2", kind: "DUEL", tileX: 27, tileY: 16, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/2", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      { id: "story-ch2-duel-3", kind: "DUEL", tileX: 31, tileY: 18, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/3", imageSrc: SOLDIER, facing: "UP", visionRange: 3, patrolAxis: "H", patrolLength: 2, patrolSweep: true },
      { id: "story-ch2-duel-4", kind: "DUEL", tileX: 18, tileY: 20, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/4", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      { id: "story-ch2-duel-6", kind: "DUEL", tileX: 19, tileY: 15, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/6", imageSrc: HELENA, facing: "LEFT", visionRange: 2 },
      { id: "story-ch2-duel-5", kind: "DUEL", tileX: 28, tileY: 25, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/5", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      // Subruta obligatoria: BigLog guarda la entrada de su búnker; vencerlo abre la compuerta del puente al jefe.
      { id: "story-ch2-duel-8", kind: "DUEL", tileX: 26, tileY: 27, sprite: "biglog", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/8", imageSrc: BIGLOG, facing: "DOWN", visionRange: 3 },
      // Jefe del acto (Helena: Núcleo de Control).
      { id: "story-ch2-duel-7", kind: "BOSS", tileX: 19, tileY: 7, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/7", imageSrc: HELENA, facing: "DOWN", visionRange: 3 },

      // Compuerta del puente al jefe: exige vencer a BigLog (sincronizar las pasarelas).
      { id: "story-a2-gate-boss", kind: "GATE", tileX: 18, tileY: 14, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch2-duel-8"] },
      // Compuerta final: el jefe es obligatorio para cruzar al Acto 3.
      { id: "story-a2-gate-act3", kind: "GATE", tileX: 19, tileY: 3, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch2-duel-7"] },
      { id: "story-ch2-transition-to-act3", kind: "WARP", tileX: 19, tileY: 1, sprite: "portal", trigger: "STEP_ON", gateRequiredNodeIds: ["story-ch2-duel-7"], warp: { toMapId: "act-3", toSpawnId: "spawn-entry", direction: "forward" } },
    ],
    spawns: [{ id: "spawn-entry", tileX: 8, tileY: 30, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

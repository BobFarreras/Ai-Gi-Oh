// src/services/story/overworld/act-2-overworld-tilemap.ts - Acto 2 "Valle Visual": búnkeres sobre un abismo digital. Ruta central con un PUENTE sin desplegar (vídeo) que abre puertas a 2 ramas con las 2 mitades de la llave; recogerlas despliega el puente al jefe.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 40;
const MAP_HEIGHT = 34;

const SOLDIER = "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp";
const HELENA = "/assets/story/opponents/opp-ch1-helena/avatar-Helena.webp";
const BIGLOG = "/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp";
const KEY_1 = "/assets/story/llave-1.webp";
const KEY_2 = "/assets/story/llave-2.webp";

// Ids reutilizados del capítulo 2 (registro + diálogos ya existentes).
const EVENT_BRIDGE = "story-ch2-event-core"; // "Diagnóstico del Valle" (vídeo del acto).
const KEY_LEFT = "story-ch2-branch-center-a"; // primera mitad de la llave.
const KEY_RIGHT = "story-ch2-branch-bottom-c"; // segunda mitad de la llave.

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
 * Acto 2: entrada (servicios) → hub → ruta central hacia un PUENTE sin desplegar. Al llegar salta el
 * vídeo (diagnóstico) y se abren dos puertas a las ramas izquierda/derecha, donde Helena guarda las
 * dos mitades de la llave. Con ambas mitades el puente se despliega hacia el jefe (Helena: Núcleo).
 * BigLog espera en la ruta tras la rama derecha para evaluarte antes de dejarte avanzar.
 */
export function buildAct2OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntry: IRect = { x0: 15, y0: 27, x1: 23, y1: 33 };
  const roomJunction: IRect = { x0: 15, y0: 18, x1: 23, y1: 24 };
  const roomLeftKey: IRect = { x0: 3, y0: 15, x1: 10, y1: 23 };
  const roomRightKey: IRect = { x0: 30, y0: 15, x1: 37, y1: 23 };
  const roomBigLog: IRect = { x0: 30, y0: 25, x1: 37, y1: 31 };
  const roomBoss: IRect = { x0: 14, y0: 3, x1: 24, y1: 10 };
  for (const room of [roomEntry, roomJunction, roomLeftKey, roomRightKey, roomBigLog, roomBoss]) fillRoom(map, room);

  // Puentes de 1 casilla.
  carveBridge(map, { x: 19, y: 26 }, { x: 19, y: 25 }); // entrada -> hub
  carveBridge(map, { x: 19, y: 17 }, { x: 19, y: 11 }); // hub -> puente central -> jefe (con vídeo + compuerta de llaves)
  carveBridge(map, { x: 11, y: 20 }, { x: 14, y: 20 }); // hub -> rama izquierda (con puerta)
  carveBridge(map, { x: 24, y: 20 }, { x: 29, y: 20 }); // hub -> rama derecha (con puerta)
  carveBridge(map, { x: 33, y: 24 }, { x: 33, y: 24 }); // rama derecha -> búnker de BigLog
  carveBridge(map, { x: 20, y: 1 }, { x: 20, y: 2 }); // jefe -> portal Acto 3 (con compuerta)

  // Rivales y servicios (sólidos). Helena BLOQUEA el único acceso al nicho de la llave en cada rama
  // (duel-1 en (6,16) mira al este, duel-6 en (34,16) mira al oeste); al vencerla se teletransporta y
  // libera su casilla. Los soldados guardan el hub central.
  for (const [x, y] of [[6, 16], [34, 16], [16, 22], [20, 22], [17, 20], [22, 22], [19, 6]]) {
    markSolid(map, x, y);
  }
  markSolid(map, 16, 29); // market
  markSolid(map, 18, 29); // arsenal
  markSolid(map, 22, 30); // teletransporte de salida
  // El portal de descenso (15,30) NO se marca sólido: un WARP debe estar sobre celda transitable.

  const racks: Array<[number, number]> = [
    [15, 27], [23, 33], [15, 18], [23, 24], [30, 31], [14, 3], [24, 10], [10, 15], [30, 23],
    // Sella el nicho de la llave izquierda (fila 16, x3-6) salvo el acceso este (7,16), guardado por Helena.
    [3, 15], [4, 15], [5, 15], [6, 15], [3, 17], [4, 17], [5, 17], [6, 17],
    // Sella el nicho de la llave derecha (fila 16, x34-37) salvo el acceso oeste (33,16).
    [34, 15], [35, 15], [36, 15], [37, 15], [34, 17], [35, 17], [36, 17], [37, 17],
  ];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  for (const [x, y] of [[16, 3], [22, 3]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }

  return validateOverworldTilemap({
    schemaVersion: 2,
    id: "act-2",
    act: 2,
    tileSize: 52,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      // Servicios del búnker de entrada + portal de descenso al Acto 1.
      { id: "story-a2-market", kind: "MARKET", tileX: 16, tileY: 29, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a2-arsenal", kind: "ARSENAL", tileX: 18, tileY: 29, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a2-teleport-hub", kind: "TELEPORT", tileX: 22, tileY: 30, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Descenso al Acto 1: se activa al PISARLO y reaparece al FINAL del Acto 1 (junto a su portal), no en su inicio.
      { id: "story-ch2-transition-to-act1", kind: "WARP", tileX: 15, tileY: 30, sprite: "portal", trigger: "STEP_ON", warp: { toMapId: "act-1", toSpawnId: "spawn-from-act2", direction: "backward" } },

      // Vídeo del diagnóstico al entrar al hub central (trigger oculto un par de casillas dentro,
      // ya con las dos puertas de las ramas a la vista): al verlo, ambas se abren con animación.
      { id: EVENT_BRIDGE, kind: "EVENT", tileX: 19, tileY: 23, sprite: "trigger", trigger: "STEP_ON", hidden: true },
      // Puente central sin desplegar: cruzar al jefe exige haber recogido las DOS mitades de la llave.
      { id: "story-a2-bridge-gate", kind: "GATE", tileX: 19, tileY: 16, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: [KEY_LEFT, KEY_RIGHT] },
      // Puertas a las ramas: se abren al ver el vídeo del puente (evento interactuado).
      { id: "story-a2-door-left", kind: "GATE", tileX: 14, tileY: 20, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: [EVENT_BRIDGE] },
      { id: "story-a2-door-right", kind: "GATE", tileX: 24, tileY: 20, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: [EVENT_BRIDGE] },

      // Mitades de la llave y Nexus: se recogen pulsando el botón estando al lado (ADJACENT_ACTION),
      // no al chocar. Bloquean su celda hasta recogerse; al FONDO del nicho, detrás de Helena.
      { id: KEY_LEFT, kind: "REWARD_NEXUS", tileX: 3, tileY: 16, sprite: "key", trigger: "ADJACENT_ACTION", imageSrc: KEY_1 },
      { id: KEY_RIGHT, kind: "REWARD_NEXUS", tileX: 37, tileY: 16, sprite: "key", trigger: "ADJACENT_ACTION", imageSrc: KEY_2 },
      { id: "story-ch2-branch-lower-down-b", kind: "REWARD_NEXUS", tileX: 35, tileY: 29, sprite: "nexus", trigger: "ADJACENT_ACTION", imageSrc: "/assets/renders/nexus.webp" },

      // Helena bloquea el acceso al nicho de la llave (mira hacia el jugador); vencerla la teletransporta.
      { id: "story-ch2-duel-1", kind: "DUEL", tileX: 6, tileY: 16, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/1", imageSrc: HELENA, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch2-duel-6", kind: "DUEL", tileX: 34, tileY: 16, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/6", imageSrc: HELENA, facing: "LEFT", visionRange: 3 },
      // Soldados: guardias del hub central (fuera de las salas de llave).
      { id: "story-ch2-duel-2", kind: "DUEL", tileX: 16, tileY: 22, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/2", imageSrc: SOLDIER, facing: "UP", visionRange: 3 },
      { id: "story-ch2-duel-3", kind: "DUEL", tileX: 20, tileY: 22, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/3", imageSrc: SOLDIER, facing: "UP", visionRange: 3, patrolAxis: "H", patrolLength: 2, patrolSweep: true },
      { id: "story-ch2-duel-4", kind: "DUEL", tileX: 17, tileY: 20, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/4", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      { id: "story-ch2-duel-5", kind: "DUEL", tileX: 22, tileY: 22, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/5", imageSrc: SOLDIER, facing: "UP", visionRange: 3 },
      // BigLog NO es un oponente estático: al PISAR la entrada del búnker (trigger oculto) salta una
      // cutscene (aparece, se acerca, narra) y al terminar arranca el combate. duel-8 queda como nodo
      // invisible (sin visión) solo para aportar el duelHref del combate.
      { id: "story-a2-biglog-trigger", kind: "EVENT", tileX: 33, tileY: 25, sprite: "trigger", trigger: "STEP_ON", hidden: true },
      { id: "story-ch2-duel-8", kind: "DUEL", tileX: 36, tileY: 30, sprite: "biglog", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/8", imageSrc: BIGLOG, hidden: true },
      // Jefe del acto (Helena: Núcleo de Control).
      { id: "story-ch2-duel-7", kind: "BOSS", tileX: 19, tileY: 6, sprite: "helena", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/2/duel/7", imageSrc: HELENA, facing: "DOWN", visionRange: 3 },

      // Compuerta final: el jefe es obligatorio para cruzar al Acto 3.
      { id: "story-a2-gate-act3", kind: "GATE", tileX: 20, tileY: 2, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch2-duel-7"] },
      { id: "story-ch2-transition-to-act3", kind: "WARP", tileX: 20, tileY: 1, sprite: "portal", trigger: "STEP_ON", gateRequiredNodeIds: ["story-ch2-duel-7"], warp: { toMapId: "act-3", toSpawnId: "spawn-entry", direction: "forward" } },
    ],
    spawns: [{ id: "spawn-entry", tileX: 19, tileY: 30, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

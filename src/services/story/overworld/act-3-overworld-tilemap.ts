// src/services/story/overworld/act-3-overworld-tilemap.ts - Acto 3 "Repositorio Fantasma" (Jaku): facility OSCURA que estrena las mecánicas v2.
// Interruptores que iluminan salas, un puzzle de caja→placa que abre una rama con caché, una cinta
// transportadora en el ascenso al núcleo y un terminal de código (SUBMISSION) que baja el cortafuegos
// hacia el jefe. Reutiliza oponentes reales (Jaku/forks, soldado, BigLog) e ids de duelo de la BD (ch3).
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 40;
const MAP_HEIGHT = 44;

const JAKU = "/assets/story/opponents/opp-ch1-jaku/avatar-Jaku.webp";
const SOLDADO_LAPTOP = "/assets/story/opponents/opp-ch3-soldado-laptop/avatar-Soldado-laptop.webp";
const NEXUS = "/assets/renders/nexus.webp";
// Render de la carta de recompensa (fusion-pytgress): se muestra en el nodo, como en el Acto 1.
const PYTGRESS = "/assets/renders/pytgress.webp";

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

/** El vacío del Deep Net es abismo digital no transitable; las salas flotan sobre él. */
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

/** Corredor recto de 1 casilla (única conexión entre salas = barrera real). */
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

/** Convierte una casilla en cinta transportadora (arrastra al jugador en la dirección dada). */
function placeBelt(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.ground[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 1;
}

function placeStructure(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.overlay[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 0;
}

/** Marca la casilla de un rival/servicio como sólida (obstáculo con el que se interactúa). */
function markSolid(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (map.collision[tileY]?.[tileX] !== 1) {
    throw new Error(`act-3-overworld: casilla (${tileX}, ${tileY}) debería estar sobre suelo transitable.`);
  }
  map.collision[tileY][tileX] = 0;
}

/**
 * Acto 3: entrada oscura (interruptor + Fork) -> hub (guardia) -> [rama izquierda: puzzle de caja/placa
 * -> caché] y [cinta de ascenso -> sala media] -> [rama derecha: terminal de código] -> jefe Jaku tras
 * una compuerta que exige hackear el cortafuegos (terminal) y superar la auditoría de BigLog.
 */
export function buildAct3OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntry: IRect = { x0: 15, y0: 36, x1: 24, y1: 42 };
  const roomHub: IRect = { x0: 14, y0: 24, x1: 25, y1: 31 };
  const roomMid: IRect = { x0: 14, y0: 13, x1: 25, y1: 20 };
  const roomPuzzle: IRect = { x0: 3, y0: 24, x1: 12, y1: 31 };
  const roomReward: IRect = { x0: 3, y0: 15, x1: 11, y1: 22 };
  const roomTerminal: IRect = { x0: 28, y0: 24, x1: 38, y1: 31 };
  const roomBigLog: IRect = { x0: 28, y0: 13, x1: 37, y1: 20 };
  const roomBoss: IRect = { x0: 15, y0: 3, x1: 26, y1: 10 };
  for (const room of [roomEntry, roomHub, roomMid, roomPuzzle, roomReward, roomTerminal, roomBigLog, roomBoss]) {
    fillRoom(map, room);
  }

  // Corredores (1 casilla).
  carveCorridor(map, { x: 19, y: 32 }, { x: 19, y: 35 }); // entrada -> hub (Fork bloquea)
  carveCorridor(map, { x: 13, y: 27 }, { x: 13, y: 27 }); // hub -> puzzle (izquierda)
  carveCorridor(map, { x: 26, y: 27 }, { x: 27, y: 27 }); // hub -> terminal (derecha)
  carveCorridor(map, { x: 6, y: 23 }, { x: 6, y: 23 }); // puzzle -> caché (compuerta de la placa)
  carveCorridor(map, { x: 26, y: 16 }, { x: 27, y: 16 }); // sala media -> BigLog (soldado bloquea)
  carveCorridor(map, { x: 33, y: 21 }, { x: 33, y: 23 }); // BigLog -> terminal (bucle lateral)
  carveCorridor(map, { x: 20, y: 11 }, { x: 20, y: 12 }); // sala media -> jefe (compuerta del cortafuegos)
  carveCorridor(map, { x: 20, y: 1 }, { x: 20, y: 2 }); // jefe -> portal Acto 4

  // Cinta de ascenso hub -> sala media (un solo sentido: no se baja por ella). La única vuelta a la
  // planta baja es por la sala derecha (media -> BigLog -> terminal -> hub), lo que fuerza esa ruta.
  for (const y of [21, 22, 23]) placeBelt(map, 19, y, GROUND_TILE.BELT_UP);

  // Rivales (sólidos). Los que están en corredor bloquean físicamente; al vencerlos se teletransportan.
  markSolid(map, 19, 34); // duel-1 Soldado-Laptop (corredor de entrada)
  markSolid(map, 19, 27); // duel-2 Soldado-Laptop (hub)
  markSolid(map, 26, 16); // duel-3 Soldado-Laptop (corredor lateral)
  markSolid(map, 7, 18); // duel-4 Soldado-Laptop (sala de caché)
  markSolid(map, 32, 16); // duel-5 Jaku (eco, aparición media)
  markSolid(map, 20, 6); // duel-6 Jaku (jefe)

  // Servicios + interruptores + consola (sólidos, se usan desde la casilla contigua).
  markSolid(map, 17, 41); // market
  markSolid(map, 18, 41); // arsenal
  markSolid(map, 22, 41); // teleport (salir)
  markSolid(map, 15, 38); // interruptor de entrada
  markSolid(map, 14, 15); // interruptor profundo (sala media)
  markSolid(map, 30, 26); // consola: registro corrupto (código)
  markSolid(map, 36, 27); // terminal del cortafuegos (SUBMISSION)
  markSolid(map, 11, 29); // botón de reinicio de cajas (rescate anti soft-lock)
  // El portal de retorno (16,41) y el de avance (20,1) NO se marcan sólidos: un WARP va sobre suelo.

  // Estructuras decorativas (racks/pantallas) en esquinas que no estorban el paso.
  const racks: Array<[number, number]> = [
    [15, 42], [24, 42], [14, 31], [25, 24], [3, 31], [12, 24], [3, 15], [11, 22],
    [28, 31], [37, 24], [28, 20], [37, 13],
  ];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  for (const [x, y] of [[16, 3], [25, 3]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }

  return validateOverworldTilemap({
    schemaVersion: 2,
    id: "act-3",
    act: 3,
    ambient: "DARK",
    tileSize: 52,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      // ── Servicios + salida ────────────────────────────────────────────────
      { id: "story-a3-market", kind: "MARKET", tileX: 17, tileY: 41, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a3-arsenal", kind: "ARSENAL", tileX: 18, tileY: 41, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a3-teleport-hub", kind: "TELEPORT", tileX: 22, tileY: 41, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Retorno al Acto 2 (se pisa).
      { id: "story-ch3-transition-to-act2", kind: "WARP", tileX: 16, tileY: 41, sprite: "portal", trigger: "STEP_ON", warp: { toMapId: "act-2", toSpawnId: "spawn-entry", direction: "backward" } },

      // ── Narrativa (eventos) ───────────────────────────────────────────────
      // La intro de BigLog (story-ch3-event-intro) se dispara al PRIMER paso del jugador (la lanza la
      // escena, no un trigger de suelo). El nodo vive en el registro clásico para su persistencia.
      // Registro corrupto (consola en la sala del terminal): revela la clave de purga.
      { id: "story-ch3-event-corrupt-log", kind: "EVENT", tileX: 30, tileY: 26, sprite: "console", trigger: "ADJACENT_ACTION" },

      // ── Mecánica: oscuridad + interruptores ───────────────────────────────
      { id: "story-ch3-switch-entrance", kind: "SWITCH", tileX: 15, tileY: 38, sprite: "switch", trigger: "ADJACENT_ACTION", lightRect: { x0: 15, y0: 32, x1: 24, y1: 42 } },
      { id: "story-ch3-switch-deep", kind: "SWITCH", tileX: 14, tileY: 15, sprite: "switch", trigger: "ADJACENT_ACTION", lightRect: { x0: 14, y0: 13, x1: 27, y1: 20 } },

      // ── Mecánica: caja empujable + placa de presión ───────────────────────
      // Empuja la caja hacia la izquierda sobre la placa para abrir la compuerta a la caché.
      { id: "story-ch3-box-1", kind: "BOX", tileX: 9, tileY: 27, sprite: "box", trigger: "ADJACENT_ACTION" },
      { id: "story-ch3-plate-1", kind: "PLATE", tileX: 4, tileY: 27, sprite: "plate", trigger: "ADJACENT_ACTION" },
      { id: "story-a3-gate-puzzle", kind: "GATE", tileX: 6, tileY: 23, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch3-plate-1"] },
      // Botón de rescate: si la caja se empotra contra una pared, la devuelve a su sitio.
      { id: "story-a3-box-reset", kind: "BOX_RESET", tileX: 11, tileY: 29, sprite: "reset", trigger: "ADJACENT_ACTION" },

      // ── Mecánica: terminal de código (SUBMISSION) ─────────────────────────
      { id: "story-ch3-firewall-terminal", kind: "SUBMISSION", tileX: 36, tileY: 27, sprite: "terminal", trigger: "ADJACENT_ACTION" },

      // ── Cachés de recompensa (se recogen pulsando al lado) ─────────────────
      { id: "story-ch3-cache-1", kind: "REWARD_NEXUS", tileX: 5, tileY: 17, sprite: "nexus", trigger: "ADJACENT_ACTION", imageSrc: NEXUS },
      { id: "story-ch3-cache-card", kind: "REWARD_CARD", tileX: 9, tileY: 17, sprite: "pytgress", trigger: "ADJACENT_ACTION", imageSrc: PYTGRESS },
      { id: "story-ch3-cache-2", kind: "REWARD_NEXUS", tileX: 16, tileY: 18, sprite: "nexus", trigger: "ADJACENT_ACTION", imageSrc: NEXUS },

      // ── Rivales (ids reales del capítulo 3) ───────────────────────────────
      // 1-4: Soldado-Laptop (centinelas del acto). 5: Jaku (eco, aparición media). 6: Jaku (jefe).
      { id: "story-ch3-duel-1", kind: "DUEL", tileX: 19, tileY: 34, sprite: "soldado-laptop", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/1", imageSrc: SOLDADO_LAPTOP, facing: "DOWN", visionRange: 3 },
      { id: "story-ch3-duel-2", kind: "DUEL", tileX: 19, tileY: 27, sprite: "soldado-laptop", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/2", imageSrc: SOLDADO_LAPTOP, facing: "DOWN", visionRange: 3, patrolAxis: "H", patrolLength: 2, patrolSweep: true },
      { id: "story-ch3-duel-3", kind: "DUEL", tileX: 26, tileY: 16, sprite: "soldado-laptop", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/3", imageSrc: SOLDADO_LAPTOP, facing: "LEFT", visionRange: 3 },
      { id: "story-ch3-duel-4", kind: "DUEL", tileX: 7, tileY: 18, sprite: "soldado-laptop", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/4", imageSrc: SOLDADO_LAPTOP, facing: "DOWN", visionRange: 2 },
      // Jaku domina toda su sala (visionRect): al entrar, combate garantizado.
      { id: "story-ch3-duel-5", kind: "DUEL", tileX: 32, tileY: 16, sprite: "jaku", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/5", imageSrc: JAKU, facing: "LEFT", visionRange: 3, visionRect: { x0: 28, y0: 13, x1: 37, y1: 20 } },
      { id: "story-ch3-duel-6", kind: "BOSS", tileX: 20, tileY: 6, sprite: "jaku", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/3/duel/6", imageSrc: JAKU, facing: "DOWN", visionRange: 3, visionRect: { x0: 15, y0: 3, x1: 26, y1: 10 } },

      // ── Compuerta del cortafuegos + portal al Acto 4 ──────────────────────
      // El jefe exige hackear el terminal (cortafuegos) y superar el eco de Jaku (duel-5).
      { id: "story-a3-gate-boss", kind: "GATE", tileX: 20, tileY: 11, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch3-firewall-terminal", "story-ch3-duel-5"] },
      { id: "story-a3-gate-act4", kind: "GATE", tileX: 20, tileY: 2, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch3-duel-6"] },
      { id: "story-ch3-transition-to-act4", kind: "WARP", tileX: 20, tileY: 1, sprite: "portal", trigger: "STEP_ON", gateRequiredNodeIds: ["story-ch3-duel-6"], warp: { toMapId: "act-4", toSpawnId: "spawn-entry", direction: "forward" } },
    ],
    spawns: [{ id: "spawn-entry", tileX: 19, tileY: 40, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

// src/services/story/overworld/act-1-overworld-tilemap.ts - Acto 1 como facility cibernética (salas de servidores + corredores), nodos centrados y oponentes con visión.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 44;
const MAP_HEIGHT = 28;

const SOLDIER = "/assets/story/opponents/opp-ch1-soldier-act01/avatar-Soldado-act01.webp";
const NEXUS = "/assets/renders/nexus.webp";
const SERVIDOR = "/assets/story/servidor-doc.webp";
const TRAP_DRAIN = "/assets/renders/traps/trap-atk-drain.webp";
const TRAP_KERNEL = "/assets/renders/traps/trap-kernel-panic.webp";

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

function buildVoidLayers(): IMutableTilemap {
  return {
    ground: Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => GROUND_TILE.GRASS as number),
    ),
    overlay: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
    collision: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
  };
}

/** Suelo de sala (panel técnico transitable). */
function fillRoom(map: IMutableTilemap, rect: IRect): void {
  for (let tileY = rect.y0; tileY <= rect.y1; tileY++) {
    for (let tileX = rect.x0; tileX <= rect.x1; tileX++) {
      map.ground[tileY][tileX] = GROUND_TILE.SAND;
      map.collision[tileY][tileX] = 1;
    }
  }
}

/** Corredor recto (lane neón). */
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

/** Estructura sólida (rack, pantalla, caja). No debe caer sobre corredor ni haz. */
function placeStructure(map: IMutableTilemap, tileX: number, tileY: number, kind: number): void {
  map.overlay[tileY][tileX] = kind;
  map.collision[tileY][tileX] = 0;
}

/** Marca la celda de un oponente como sólida (bloquea su casilla, no el corredor). */
function markOpponent(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (map.collision[tileY]?.[tileX] !== 1) {
    throw new Error(`act-1-overworld: oponente en (${tileX}, ${tileY}) debería estar sobre suelo transitable.`);
  }
  map.collision[tileY][tileX] = 0;
}

/**
 * Rellena la sala de la subruta con servidores dejando solo el pasillo (bajada por
 * la columna 12 y giro por la fila 21) y la hornacina del rival en (16,20).
 */
function sealSideRoomWithServers(map: IMutableTilemap, room: IRect): void {
  const isCorridor = (x: number, y: number): boolean =>
    (x === 12 && y >= 18 && y <= 21) || (y === 21 && x >= 12 && x <= 18);
  for (let tileY = room.y0; tileY <= room.y1; tileY++) {
    for (let tileX = room.x0; tileX <= room.x1; tileX++) {
      if (isCorridor(tileX, tileY)) continue;
      if (tileX === 16 && tileY === 20) continue; // hornacina del guardián
      map.overlay[tileY][tileX] = OVERLAY_TILE.SERVER_RACK;
      map.collision[tileY][tileX] = 0;
    }
  }
}

/**
 * Acto 1 como facility: sala de entrada → sala de servidores A (evento/nexus + rival vigilando)
 * → sala de jefes → rama lateral inferior. Los pickups (nexus/cartas/eventos) están centrados
 * en las salas (STEP_ON) y los rivales vigilan el corredor con su rango de visión (estilo Pokémon).
 */
export function buildAct1OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntrance: IRect = { x0: 3, y0: 10, x1: 9, y1: 16 };
  const roomServerA: IRect = { x0: 14, y0: 9, x1: 22, y1: 17 };
  // La sala de jefes acaba en x37: el portal queda en un saliente de un tile
  // sellado por la puerta del jefe (no se puede rodear).
  const roomBosses: IRect = { x0: 27, y0: 8, x1: 37, y1: 18 };
  const roomSide: IRect = { x0: 9, y0: 18, x1: 20, y1: 24 };
  for (const room of [roomEntrance, roomServerA, roomBosses, roomSide]) fillRoom(map, room);

  // Corredor principal (une entrada → servidores → jefes) y rama lateral hacia la sala inferior.
  carveCorridor(map, { x: 4, y: 13 }, { x: 39, y: 13 });
  carveCorridor(map, { x: 12, y: 13 }, { x: 12, y: 21 });
  carveCorridor(map, { x: 12, y: 21 }, { x: 18, y: 21 });

  // La sala de la subruta difícil queda SELLADA con servidores: solo se pasa por el pasillo.
  sealSideRoomWithServers(map, roomSide);

  // Rivales (sólidos) que vigilan; se marcan tras sellar (para no pisar sus casillas).
  for (const [x, y] of [[16, 11], [30, 11], [34, 15], [37, 11], [16, 20]]) markOpponent(map, x, y);
  // El nodo Market es un obstáculo sólido con el que se interactúa al acercarse.
  markOpponent(map, 5, 11);

  // Racks de servidor, pantallas y cajas para dar volumen a las salas (no tocan corredores ni haces).
  const racks: Array<[number, number]> = [
    [4, 10], [8, 10], [4, 16], [8, 16],
    [15, 9], [21, 9], [15, 17], [21, 17],
    [28, 8], [36, 8], [28, 18], [36, 18], [33, 8],
  ];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  for (const [x, y] of [[18, 9], [33, 18]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }
  for (const [x, y] of [[7, 15], [31, 16]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.CRATE);
  }

  return validateOverworldTilemap({
    schemaVersion: 1,
    id: "act-1",
    act: 1,
    tileSize: 52,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      // Trigger invisible a 2 casillas del spawn: al pisarlo suena el dispositivo y salta el vídeo intro.
      { id: "story-a1-event-biglog-briefing", kind: "EVENT", tileX: 6, tileY: 13, sprite: "trigger", trigger: "STEP_ON", hidden: true },
      // Recompensas: se cogen al CHOCAR con ellas (BUMP); bloquean su celda hasta recogerse.
      { id: "story-a1-reward-nexus-cache", kind: "REWARD_NEXUS", tileX: 18, tileY: 11, sprite: "nexus", trigger: "BUMP", imageSrc: NEXUS },
      { id: "story-a1-event-special-card-signal", kind: "EVENT", tileX: 20, tileY: 15, sprite: "servidor", trigger: "STEP_ON", imageSrc: SERVIDOR },
      { id: "story-a1-reward-card-guardian", kind: "REWARD_CARD", tileX: 16, tileY: 15, sprite: "trap-drain", trigger: "BUMP", imageSrc: TRAP_DRAIN },
      // Nodo Market: al acercarse y pulsar A abre el mercado (y vuelve al mapa).
      { id: "story-a1-market", kind: "MARKET", tileX: 5, tileY: 11, sprite: "market", trigger: "ADJACENT_ACTION" },
      // Subruta difícil: trigger invisible en el corredor; al pisarlo aparece BigLog y avisa. Recompensa: carta potente.
      { id: "story-a1-side-event-echo-fragment", kind: "EVENT", tileX: 12, tileY: 16, sprite: "trigger", trigger: "STEP_ON", hidden: true },
      { id: "story-a1-side-reward-card", kind: "REWARD_CARD", tileX: 18, tileY: 21, sprite: "trap-kernel", trigger: "BUMP", imageSrc: TRAP_KERNEL },

      // Rivales con rango de visión: vigilan el corredor y retan al cruzar su haz.
      { id: "story-ch1-duel-1", kind: "DUEL", tileX: 16, tileY: 11, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/1/duel/1", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      { id: "story-ch1-duel-2", kind: "DUEL", tileX: 16, tileY: 20, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/1/duel/2", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3 },
      // Rivales que patrullan (sentry): pasean vigilando el corredor con su haz.
      // gateRequiredNodeIds refleja la cadena de desbloqueo de la BD (1→3→4→5): su radar
      // no reta hasta cumplir el requisito (evita el "Duelo bloqueado" al esquivar a otro).
      { id: "story-ch1-duel-3", kind: "DUEL", tileX: 30, tileY: 11, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/1/duel/3", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3, patrolAxis: "H", patrolLength: 3, gateRequiredNodeIds: ["story-ch1-duel-1"] },
      { id: "story-ch1-duel-4", kind: "DUEL", tileX: 34, tileY: 15, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/1/duel/4", imageSrc: SOLDIER, facing: "UP", visionRange: 3, patrolAxis: "H", patrolLength: 2, gateRequiredNodeIds: ["story-ch1-duel-3"] },
      { id: "story-ch1-duel-5", kind: "BOSS", tileX: 37, tileY: 11, sprite: "soldier", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/1/duel/5", imageSrc: SOLDIER, facing: "DOWN", visionRange: 3, gateRequiredNodeIds: ["story-ch1-duel-4"] },

      // Puerta que cierra el paso a la sala de jefes hasta ganar el primer duelo.
      {
        id: "story-a1-gate-descent",
        kind: "GATE",
        tileX: 25,
        tileY: 13,
        sprite: "gate",
        trigger: "ADJACENT_ACTION",
        gateRequiredNodeIds: ["story-ch1-duel-1"],
      },
      // Puerta final: el jefe es obligatorio para cruzar al Acto 2.
      {
        id: "story-a1-gate-boss",
        kind: "GATE",
        tileX: 38,
        tileY: 13,
        sprite: "gate",
        trigger: "ADJACENT_ACTION",
        gateRequiredNodeIds: ["story-ch1-duel-5"],
      },
      {
        id: "story-ch1-transition-to-act2",
        kind: "WARP",
        tileX: 39,
        tileY: 13,
        sprite: "portal",
        trigger: "STEP_ON",
        warp: { toMapId: "act-2", toSpawnId: "spawn-entry", direction: "forward" },
      },
    ],
    spawns: [{ id: "spawn-entry", tileX: 4, tileY: 13, facing: "RIGHT" }],
    defaultSpawnId: "spawn-entry",
  });
}

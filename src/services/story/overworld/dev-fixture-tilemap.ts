// src/services/story/overworld/dev-fixture-tilemap.ts - Mapa abierto de pruebas (Fase 0/1), validado por el mismo pipeline que los mapas reales.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 40;
const MAP_HEIGHT = 28;

interface IMutableTilemap {
  ground: number[][];
  overlay: number[][];
  collision: number[][];
}

function buildBlankLayers(): IMutableTilemap {
  return {
    ground: Array.from({ length: MAP_HEIGHT }, () =>
      Array.from({ length: MAP_WIDTH }, () => GROUND_TILE.GRASS as number),
    ),
    overlay: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 0)),
    collision: Array.from({ length: MAP_HEIGHT }, () => Array.from({ length: MAP_WIDTH }, () => 1)),
  };
}

function isInside(tileX: number, tileY: number): boolean {
  return tileX >= 0 && tileX < MAP_WIDTH && tileY >= 0 && tileY < MAP_HEIGHT;
}

/** Coloca un árbol (decoración por encima + celda bloqueada). */
function placeTree(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (!isInside(tileX, tileY)) return;
  map.overlay[tileY][tileX] = OVERLAY_TILE.TREE;
  map.collision[tileY][tileX] = 0;
}

/** Marca una celda como obstáculo sólido para un objeto de acción adyacente. */
function markSolidObjectCell(map: IMutableTilemap, tileX: number, tileY: number): void {
  if (!isInside(tileX, tileY) || map.collision[tileY][tileX] !== 1) {
    throw new Error(`dev-fixture: celda de objeto (${tileX}, ${tileY}) no es hierba transitable.`);
  }
  map.collision[tileY][tileX] = 0;
}

/** Borde natural de bosque (dos filas/columnas con variación) en vez de caja gris. */
function paintForestBorder(map: IMutableTilemap): void {
  for (let tileX = 0; tileX < MAP_WIDTH; tileX++) {
    placeTree(map, tileX, 0);
    placeTree(map, tileX, MAP_HEIGHT - 1);
    if ((tileX * 7) % 5 !== 0) {
      placeTree(map, tileX, 1);
      placeTree(map, tileX, MAP_HEIGHT - 2);
    }
  }
  for (let tileY = 0; tileY < MAP_HEIGHT; tileY++) {
    placeTree(map, 0, tileY);
    placeTree(map, MAP_WIDTH - 1, tileY);
    if ((tileY * 3) % 4 !== 0) {
      placeTree(map, 1, tileY);
      placeTree(map, MAP_WIDTH - 2, tileY);
    }
  }
}

/** Camino serpenteante horizontal (2 tiles de ancho) con un ramal hacia el sur. */
function paintPath(map: IMutableTilemap): void {
  for (let tileX = 3; tileX <= 31; tileX++) {
    const row = 14 + Math.round(Math.sin(tileX / 3) * 1.5);
    map.ground[row][tileX] = GROUND_TILE.PATH;
    map.ground[row + 1][tileX] = GROUND_TILE.PATH;
  }
  for (let tileY = 15; tileY <= 24; tileY++) {
    map.ground[tileY][20] = GROUND_TILE.PATH;
    map.ground[tileY][21] = GROUND_TILE.PATH;
  }
}

/**
 * Corredor de un solo tile hacia la puerta y el portal: choke real gateado.
 * Los árboles a ambos lados (filas 13 y 15) sellan el paso para que la única
 * forma de llegar al portal sea cruzar la puerta en (33,14).
 */
function paintGateCorridor(map: IMutableTilemap): void {
  for (let tileX = 31; tileX <= 37; tileX++) {
    map.ground[14][tileX] = GROUND_TILE.PATH;
    map.collision[14][tileX] = 1;
    if (tileX >= 32) {
      placeTree(map, tileX, 13);
      placeTree(map, tileX, 15);
    }
  }
}

/** Estanque con orilla de arena (agua no transitable). */
function paintPond(map: IMutableTilemap): void {
  const centerX = 29;
  const centerY = 8;
  for (let tileY = centerY - 3; tileY <= centerY + 3; tileY++) {
    for (let tileX = centerX - 4; tileX <= centerX + 4; tileX++) {
      const dx = (tileX - centerX) / 4;
      const dy = (tileY - centerY) / 3;
      if (dx * dx + dy * dy > 1) continue;
      map.ground[tileY][tileX] = GROUND_TILE.WATER;
      map.collision[tileY][tileX] = 0;
    }
  }
  for (let tileY = centerY - 4; tileY <= centerY + 4; tileY++) {
    for (let tileX = centerX - 5; tileX <= centerX + 5; tileX++) {
      if (!isInside(tileX, tileY)) continue;
      if (map.ground[tileY][tileX] !== GROUND_TILE.GRASS || map.collision[tileY][tileX] !== 1) continue;
      const touchesWater =
        map.ground[tileY - 1]?.[tileX] === GROUND_TILE.WATER ||
        map.ground[tileY + 1]?.[tileX] === GROUND_TILE.WATER ||
        map.ground[tileY]?.[tileX - 1] === GROUND_TILE.WATER ||
        map.ground[tileY]?.[tileX + 1] === GROUND_TILE.WATER;
      if (touchesWater) map.ground[tileY][tileX] = GROUND_TILE.SAND;
    }
  }
}

/** Flores (transitables) y arboledas sueltas para textura. */
function paintDecor(map: IMutableTilemap): void {
  const flowerSpots = [[8, 6], [9, 6], [8, 7], [14, 21], [15, 21], [24, 20], [12, 10]];
  for (const [tileX, tileY] of flowerSpots) {
    if (map.collision[tileY]?.[tileX] === 1 && map.ground[tileY][tileX] === GROUND_TILE.GRASS) {
      map.ground[tileY][tileX] = GROUND_TILE.FLOWER;
    }
  }
  for (const [tileX, tileY] of [[7, 23], [8, 23], [35, 23], [10, 4], [34, 4]]) {
    placeTree(map, tileX, tileY);
  }
}

/**
 * Mapa abierto de la Fase 0/1: hierba con camino serpenteante, estanque y bordes
 * de bosque (nada de caja gris). Pasa por `validateOverworldTilemap` para cumplir
 * el mismo contrato que los mapas de producción. Sin `atlasSrc`: render procedural.
 */
export function buildOverworldDevFixtureTilemap(): IOverworldTilemap {
  const map = buildBlankLayers();
  paintForestBorder(map);
  paintPath(map);
  paintPond(map);
  paintGateCorridor(map);
  paintDecor(map);

  // Objetos de acción adyacente: sólidos (se rodean y se miran, no se pisan).
  markSolidObjectCell(map, 6, 12); // NPC
  markSolidObjectCell(map, 16, 11); // DUEL
  markSolidObjectCell(map, 24, 18); // REWARD
  markSolidObjectCell(map, 21, 25); // EVENT

  return validateOverworldTilemap({
    schemaVersion: 1,
    id: "dev-fixture",
    act: 1,
    tileSize: 48,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    layers: { ground: map.ground, overlay: map.overlay },
    collision: map.collision,
    objects: [
      { id: "dev-npc-mentor", kind: "NPC", tileX: 6, tileY: 12, sprite: "npc-mentor", trigger: "ADJACENT_ACTION" },
      {
        id: "story-ch1-duel-1",
        kind: "DUEL",
        tileX: 16,
        tileY: 11,
        sprite: "rival-apprentice",
        trigger: "ADJACENT_ACTION",
        duelHref: "/hub/story/chapter/1/duel/1",
      },
      { id: "dev-reward-nexus", kind: "REWARD_NEXUS", tileX: 24, tileY: 18, sprite: "nexus-cache", trigger: "ADJACENT_ACTION" },
      { id: "dev-event-signal", kind: "EVENT", tileX: 21, tileY: 25, sprite: "event-signal", trigger: "ADJACENT_ACTION" },
      {
        id: "dev-gate-bridge",
        kind: "GATE",
        tileX: 33,
        tileY: 14,
        sprite: "gate-energy",
        trigger: "ADJACENT_ACTION",
        gateRequiredNodeIds: ["story-ch1-duel-1"],
      },
      {
        id: "dev-warp-act2",
        kind: "WARP",
        tileX: 36,
        tileY: 14,
        sprite: "portal",
        trigger: "STEP_ON",
        warp: { toMapId: "act-2", toSpawnId: "spawn-entry", direction: "forward" },
      },
    ],
    spawns: [{ id: "spawn-entry", tileX: 4, tileY: 14, facing: "RIGHT" }],
    defaultSpawnId: "spawn-entry",
  });
}

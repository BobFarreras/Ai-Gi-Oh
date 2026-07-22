// src/services/story/overworld/act-4-overworld-tilemap.ts - Acto 4 "Núcleo GenNvim": mainframe de estética
// TERMINAL (verde fósforo). FASE 1 = esqueleto navegable: 3 franjas verticales (entrada → hub → laberinto →
// salas altas → jefe) con salas, corredores, spawn, servicios y warp de retorno al Acto 3. Rivales, puzzles
// (cajas + cintas), puertas por victoria y objetos llegan en fases posteriores.
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";

const MAP_WIDTH = 52;
const MAP_HEIGHT = 70;

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

interface IMazeSpec {
  bodyY0: number; // primera fila a tapiar (borde superior del laberinto)
  bodyY1: number; // última fila a tapiar (borde inferior)
  nodeX0: number;
  nodeY0: number;
  cols: number; // nodos en x = nodeX0, nodeX0+2, ...
  rows: number; // nodos en y = nodeY0, nodeY0+2, ...
  seed: number; // semilla fija -> laberinto determinista (idéntico en cada build)
  start: [number, number]; // nodo (i,j) donde arranca el backtracker
}
interface IMazeHandle {
  nodeX: (i: number) => number;
  nodeY: (j: number) => number;
  carve: (x: number, y: number) => void;
  findDeadEnd: (reserved: Set<string>, fallback: [number, number]) => [number, number];
}

/**
 * Talla un LABERINTO REAL (maze perfecto) en el rectángulo dado: tapia el cuerpo con servidores y abre pasillos
 * de 1 casilla con un backtracker recursivo determinista (mulberry32 con semilla fija) -> bifurcaciones, cruces y
 * CALLEJONES SIN SALIDA (un único camino correcto entre dos puntos). El caller abre los "breach" de entrada/salida
 * y coloca objetos en callejones (findDeadEnd) o salas laterales.
 */
function carveMaze(map: IMutableTilemap, spec: IMazeSpec): IMazeHandle {
  const { bodyY0, bodyY1, nodeX0, nodeY0, cols, rows, seed, start } = spec;
  const nodeX = (i: number): number => nodeX0 + 2 * i;
  const nodeY = (j: number): number => nodeY0 + 2 * j;
  const carve = (x: number, y: number): void => {
    map.overlay[y][x] = 0;
    map.collision[y][x] = 1;
  };
  // 1) Tapiar el cuerpo; 2) vaciar los nodos de la malla.
  for (let y = bodyY0; y <= bodyY1; y++) for (let x = nodeX(0); x <= nodeX(cols - 1); x++) {
    placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) carve(nodeX(i), nodeY(j));
  // 3) Backtracker determinista: abre la pared entre nodos vecinos no visitados.
  let s = seed >>> 0;
  const rng = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const visited = new Set<string>([`${start[0]},${start[1]}`]);
  const stack: Array<[number, number]> = [start];
  while (stack.length > 0) {
    const [ci, cj] = stack[stack.length - 1];
    const options: Array<[number, number]> = [];
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
      const ni = ci + di;
      const nj = cj + dj;
      if (ni >= 0 && ni < cols && nj >= 0 && nj < rows && !visited.has(`${ni},${nj}`)) options.push([ni, nj]);
    }
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [ni, nj] = options[Math.floor(rng() * options.length)];
    carve((nodeX(ci) + nodeX(ni)) / 2, (nodeY(cj) + nodeY(nj)) / 2);
    visited.add(`${ni},${nj}`);
    stack.push([ni, nj]);
  }
  const degree = (i: number, j: number): number => {
    const x = nodeX(i);
    const y = nodeY(j);
    let d = 0;
    if (i < cols - 1 && map.collision[y][x + 1] === 1) d++;
    if (i > 0 && map.collision[y][x - 1] === 1) d++;
    if (j < rows - 1 && map.collision[y + 1][x] === 1) d++;
    if (j > 0 && map.collision[y - 1][x] === 1) d++;
    return d;
  };
  const findDeadEnd = (reserved: Set<string>, fallback: [number, number]): [number, number] => {
    for (let j = rows - 1; j >= 0; j--) {
      for (let i = 0; i < cols; i++) {
        if (reserved.has(`${i},${j}`)) continue;
        if (degree(i, j) === 1) return [nodeX(i), nodeY(j)];
      }
    }
    return fallback;
  };
  return { nodeX, nodeY, carve, findDeadEnd };
}

/**
 * Acto 4 "Núcleo GenNvim": entrada (servicios + retorno) -> LABERINTO 1 (hub) -> LABERINTO 2 (con el puzzle del
 * módulo/pasarela) -> terminal -> sala del jefe (GenNvim + Midutech). Dos mazes reales en cadena, con salas
 * laterales guardadas (aumentos ATK/DEF) y objetos escondidos en callejones sin salida.
 */
export function buildAct4OverworldTilemap(): IOverworldTilemap {
  const map = buildVoidLayers();

  const roomEntry: IRect = { x0: 20, y0: 62, x1: 32, y1: 68 };
  const roomHub: IRect = { x0: 18, y0: 45, x1: 34, y1: 59 }; // LABERINTO 1 (18..34 x 45..59)
  const roomLeftLow: IRect = { x0: 4, y0: 47, x1: 15, y1: 55 };
  const roomRightLow: IRect = { x0: 37, y0: 47, x1: 48, y1: 55 };
  const roomLab: IRect = { x0: 18, y0: 25, x1: 34, y1: 42 }; // LABERINTO 2 (con el puzzle del módulo/pasarela)
  const roomLeftUp: IRect = { x0: 4, y0: 25, x1: 14, y1: 33 };
  const roomRightUp: IRect = { x0: 38, y0: 25, x1: 48, y1: 33 };
  const roomTerminal: IRect = { x0: 20, y0: 13, x1: 32, y1: 21 };
  const roomBoss: IRect = { x0: 18, y0: 3, x1: 34, y1: 11 };
  for (const room of [roomEntry, roomHub, roomLeftLow, roomRightLow, roomLab, roomLeftUp, roomRightUp, roomTerminal, roomBoss]) {
    fillRoom(map, room);
  }

  // Corredores (1 casilla). Espina central: entrada -> laberinto 1 (hub) -> laberinto 2 -> terminal -> jefe.
  carveCorridor(map, { x: 26, y: 60 }, { x: 26, y: 61 }); // entrada -> laberinto 1
  carveCorridor(map, { x: 26, y: 43 }, { x: 26, y: 44 }); // laberinto 1 -> laberinto 2
  carveCorridor(map, { x: 26, y: 22 }, { x: 26, y: 24 }); // laberinto 2 -> terminal
  carveCorridor(map, { x: 26, y: 12 }, { x: 26, y: 12 }); // terminal -> jefe
  // Ramas bajas (izquierda / derecha) desde el laberinto 1.
  carveCorridor(map, { x: 15, y: 51 }, { x: 17, y: 51 }); // laberinto 1 -> rama izq baja (aumento ATK, guardia duel-2)
  carveCorridor(map, { x: 35, y: 51 }, { x: 36, y: 51 }); // laberinto 1 -> rama der baja (sala opcional)
  // Ramas altas desde el laberinto 2: rivales-guardia OBLIGATORIOS (no se llega al aumento de DEF ni al botón).
  carveCorridor(map, { x: 15, y: 29 }, { x: 17, y: 29 }); // laberinto 2 -> sala izq alta (aumento DEF, guardia duel-4)
  carveCorridor(map, { x: 35, y: 29 }, { x: 37, y: 29 }); // laberinto 2 -> sala der alta (botón cinta, guardia duel-3)

  // Embudo de salida (y=25/26): pared de servidores con hueco SOLO en x=26. La cámara (y=27) queda abierta, pero el
  // puente que sube (cinta) va EN CONTRA: no se sube hasta accionar el INTERRUPTOR del laberinto 2 (belt-toggle),
  // que invierte la pasarela de forma PERMANENTE (se marca interactuado -> queda fija; anti soft-lock).
  for (const funnelY of [25, 26]) {
    for (let x = 18; x <= 34; x++) if (x !== 26) placeStructure(map, x, funnelY, OVERLAY_TILE.SERVER_RACK);
  }

  // LABERINTO 1 (sala de abajo / "hub", y=45..59): maze real de navegación. Nodos 9x6 en x=18..34, y=47..57.
  // Se entra por abajo (breach x=26 en el borde y=58, desde la sala de entrada) y se sale por arriba (breach x=26
  // en el borde y=46, hacia el corredor que sube al laberinto 2). Salidas laterales en el nodo (18,51)/(34,51).
  const hubMaze = carveMaze(map, { bodyY0: 46, bodyY1: 58, nodeX0: 18, nodeY0: 47, cols: 9, rows: 6, seed: 0x51ce7a2f, start: [4, 5] });
  hubMaze.carve(26, 58); // entrada (abajo) desde la sala de entrada
  hubMaze.carve(26, 46); // salida (arriba) hacia el laberinto 2
  // Carta ANTIGRABITY escondida en un rincón (callejón sin salida) del laberinto 1.
  const [cardTileX, cardTileY] = hubMaze.findDeadEnd(
    new Set(["4,5", "4,0", "0,2", "8,2"]), // reservados: entrada, salida, salidas laterales (izq ATK / der DEF)
    [20, 47],
  );

  // LABERINTO 2 (sala del módulo, y=25..42): maze real + puzzle. Nodos 9x6 en x=18..34, y=29..39. La cámara del
  // módulo cuelga arriba (y=27); se entra por abajo (breach x=26 en y=40) y se sale a la cámara por el hueco (30,28).
  const labMaze = carveMaze(map, { bodyY0: 28, bodyY1: 40, nodeX0: 18, nodeY0: 29, cols: 9, rows: 6, seed: 0x1a2b3c4d, start: [4, 5] });
  labMaze.carve(26, 40); // nodo entrada (26,39) -> antesala (y41/42) -> corredor desde el laberinto 1
  labMaze.carve(30, 28); // nodo (30,29) -> cámara del módulo (30,27)
  // El USB va en un CALLEJÓN SIN SALIDA real (nodo de grado 1), como los objetos escondidos de Pokémon.
  const [usbTileX, usbTileY] = labMaze.findDeadEnd(
    new Set(["4,5", "6,0", "0,0", "8,0"]), // reservados: entrada, salida-cámara, salidas laterales (izq/der)
    [20, 39],
  );

  // Puente lab -> terminal: cinta EN CONTRA (empuja hacia abajo). No se sube hasta insertar el módulo en la
  // ranura (belt-toggle sobre la placa): al hacerlo, la pasarela se invierte y queda fija (onPlatePressed la
  // enclava permanentemente), así que aunque la caja se mueva/resetee después no hay soft-lock.
  for (const y of [22, 23, 24]) placeBelt(map, 26, y, GROUND_TILE.BELT_DOWN);

  // Estructuras decorativas (racks + refrigeración + pilones) en esquinas de las salas que no estorban el paso.
  const racks: Array<[number, number]> = [[20, 68], [32, 68], [4, 55], [48, 47], [4, 25], [48, 33]];
  for (const [x, y] of racks) placeStructure(map, x, y, OVERLAY_TILE.SERVER_RACK);
  const coolers: Array<[number, number]> = [[20, 62], [37, 55], [14, 33], [18, 25]];
  for (const [x, y] of coolers) placeStructure(map, x, y, OVERLAY_TILE.COOLING_UNIT);
  const pylons: Array<[number, number]> = [[32, 62], [15, 47], [38, 25], [20, 13]];
  for (const [x, y] of pylons) placeStructure(map, x, y, OVERLAY_TILE.DATA_PYLON);
  for (const [x, y] of [[18, 3], [34, 3]] as Array<[number, number]>) {
    placeStructure(map, x, y, OVERLAY_TILE.HOLO_SCREEN);
  }

  // Servicios (sólidos, se usan desde la casilla contigua) + retorno al Acto 3 (se pisa, sobre suelo).
  markSolid(map, 23, 67); // market
  markSolid(map, 25, 67); // arsenal
  markSolid(map, 30, 67); // teleport (salir)
  markSolid(map, 22, 27); // INTERRUPTOR que invierte la pasarela del puente (belt-toggle), en la cámara del laberinto 2

  // Recompensas (pulsar A al lado): USB (laberinto 2) + carta ANTIGRABITY (laberinto 1) + aumentos ATK/DEF.
  markSolid(map, usbTileX, usbTileY); // USB Raro (callejón sin salida del laberinto 2)
  markSolid(map, cardTileX, cardTileY); // carta ANTIGRABITY (callejón sin salida del laberinto 1)
  markSolid(map, 7, 51); // aumento de ATAQUE (rama izq del laberinto 1, tras el guardia duel-2)
  markSolid(map, 44, 51); // aumento de DEFENSA (rama der del laberinto 1, tras el guardia duel-3)

  // Rivales (sólidos): al vencerlos se teletransportan y liberan su casilla.
  markSolid(map, 26, 61); // duel-1 Soldado-Terminal (corredor de entrada, chokepoint único)
  markSolid(map, 16, 51); // duel-2 (rama izq del laberinto 1, guardia del aumento ATK)
  markSolid(map, 36, 51); // duel-3 (rama der del laberinto 1, guardia del aumento DEF)
  markSolid(map, 16, 29); // duel-4 (rama izq del laberinto 2, guardia de la sala de la Hydra)
  markSolid(map, 30, 17); // duel-5 (guardia del terminal)
  markSolid(map, 26, 9); // duel-6 GenNvim (boss 1, mitad baja de la sala del jefe)
  markSolid(map, 26, 4); // duel-7 Midutech (boss final, mitad alta, tras la puerta post-jefe)
  // Muro de atrezzo que parte la sala del jefe en dos; hueco en x=26 con la puerta post-GenNvim.
  for (let x = 18; x <= 34; x++) if (x !== 26) placeStructure(map, x, 6, OVERLAY_TILE.SERVER_RACK);

  // Consola de evento narrativo del terminal (se usa desde el lado).
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
      { id: "story-a4-market", kind: "MARKET", tileX: 23, tileY: 67, sprite: "market", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-arsenal", kind: "ARSENAL", tileX: 25, tileY: 67, sprite: "arsenal", trigger: "ADJACENT_ACTION" },
      { id: "story-a4-teleport-hub", kind: "TELEPORT", tileX: 30, tileY: 67, sprite: "teleport", trigger: "ADJACENT_ACTION" },
      // Retorno al Acto 3 (se pisa). El avance al Acto 5 se añadirá con el jefe (Acto 5 = "próximamente").
      { id: "story-ch4-transition-to-act3", kind: "WARP", tileX: 20, tileY: 65, sprite: "portal", trigger: "STEP_ON", warp: { toMapId: "act-3", toSpawnId: "spawn-entry", direction: "backward" } },

      // ── Laberinto 2: el puente que sube (cinta) va EN CONTRA. El INTERRUPTOR de la cámara invierte la pasarela ──
      // de forma PERMANENTE (belt-toggle: al accionarlo se marca interactuado y la cinta queda subiendo para siempre).
      { id: "story-ch4-belt-switch", kind: "SWITCH", tileX: 22, tileY: 27, sprite: "switch", trigger: "ADJACENT_ACTION", beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 } },
      // Compuerta terminal->jefe: requiere vencer al centinela de antesala (duel-5).
      { id: "story-a4-gate-boss", kind: "GATE", tileX: 26, tileY: 12, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-5"] },

      // ── Rivales (ids reales del capítulo 4; duelHref -> /hub/story/chapter/4/duel/N) ─────────────────
      // 1-5: Soldado-Terminal (centinelas). 6: GenNvim (boss 1). 7: Midutech (boss final).
      { id: "story-ch4-duel-1", kind: "DUEL", tileX: 26, tileY: 61, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/1", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-2", kind: "DUEL", tileX: 16, tileY: 51, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/2", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-3", kind: "DUEL", tileX: 36, tileY: 51, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/3", imageSrc: SOLDADO, facing: "LEFT", visionRange: 3 },
      { id: "story-ch4-duel-4", kind: "DUEL", tileX: 16, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/4", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-5", kind: "DUEL", tileX: 30, tileY: 17, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/5", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-6", kind: "BOSS", tileX: 26, tileY: 9, sprite: "gennvim", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/6", imageSrc: GENNVIM, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 7, x1: 34, y1: 11 } },
      { id: "story-ch4-duel-7", kind: "BOSS", tileX: 26, tileY: 4, sprite: "midutech", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/7", imageSrc: MIDUTECH, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 3, x1: 34, y1: 5 } },

      // ── Recompensas: USB + aumentos ATK/DEF (objetos) + carta ANTIGRABITY (recompensa de carta) ──────
      { id: "story-ch4-cache-usb", kind: "REWARD_OBJECT", tileX: usbTileX, tileY: usbTileY, sprite: "usb-raro", trigger: "ADJACENT_ACTION", imageSrc: USB },
      { id: "story-ch4-cache-atk", kind: "REWARD_OBJECT", tileX: 7, tileY: 51, sprite: "atk-augment", trigger: "ADJACENT_ACTION", imageSrc: ATK_AUGMENT },
      { id: "story-ch4-cache-def", kind: "REWARD_OBJECT", tileX: 44, tileY: 51, sprite: "def-augment", trigger: "ADJACENT_ACTION", imageSrc: DEF_AUGMENT },
      // Carta ANTIGRABITY escondida en un rincón del laberinto 1; al cogerla salta un aviso de BigLog.
      { id: "story-ch4-card-antigrabity", kind: "REWARD_CARD", tileX: cardTileX, tileY: cardTileY, sprite: "card", trigger: "ADJACENT_ACTION" },

      // ── Puerta post-GenNvim: SOLO abre tras vencer a GenNvim (duel-6); sella a Midutech ──────────────
      { id: "story-a4-gate-postboss", kind: "GATE", tileX: 26, tileY: 6, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-6"] },

      // ── Eventos narrativos ────────────────────────────────────────────────────────────────────────
      // Consola del terminal (se lee pulsando al lado): E4 registro-madre.
      { id: "story-ch4-event-revelation", kind: "EVENT", tileX: 24, tileY: 18, sprite: "console", trigger: "ADJACENT_ACTION" },
      // Triggers ocultos (se pisan, una vez): E3 al entrar al laberinto; belt-locked al llegar al puente en
      // contra; E5 tras vencer a GenNvim (celda naturalmente sellada por su casilla sólida); E6 tras Midutech.
      { id: "story-ch4-event-belts", kind: "EVENT", tileX: 26, tileY: 42, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-belt-locked", kind: "EVENT", tileX: 26, tileY: 25, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-pre-midutech", kind: "EVENT", tileX: 26, tileY: 7, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-core-key", kind: "EVENT", tileX: 26, tileY: 3, sprite: "hidden", trigger: "STEP_ON", hidden: true },
    ],
    spawns: [{ id: "spawn-entry", tileX: 26, tileY: 66, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

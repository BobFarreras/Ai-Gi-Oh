// src/services/story/overworld/act-4-overworld-tilemap.ts - Acto 4 "Núcleo GenNvim": mainframe de estética
// TERMINAL (verde fósforo). FASE 1 = esqueleto navegable: 3 franjas verticales (entrada → hub → laberinto →
// salas altas → jefe) con salas, corredores, spawn, servicios y warp de retorno al Acto 3. Rivales, puzzles
// (cajas + cintas), puertas por victoria y objetos llegan en fases posteriores.
import { OverworldDirection } from "@/core/services/story/overworld/overworld-types";
import { IOverworldTilemap } from "@/services/story/overworld/tilemap-schema";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import { GROUND_TILE, OVERLAY_TILE } from "@/services/story/overworld/overworld-tile-kinds";
import { traceWalkableCorridor } from "@/services/story/overworld/trace-walkable-corridor";

const MAP_WIDTH = 52;
const MAP_HEIGHT = 70;

/**
 * A cuántas casillas del acceso a la carta Hydra salta la emboscada de GenNvim (duel-8): 2 = el jugador ve
 * la carta a tiro y, justo antes de alcanzarla, le cortan el paso por detrás.
 */
export const HYDRA_AMBUSH_TILES_BEFORE_CARD = 2;
/** Id del trigger oculto que lanza la cutscene de emboscada de GenNvim (y del diálogo que narra). */
export const HYDRA_AMBUSH_TRIGGER_ID = "story-ch4-event-hydra";
/** Id del duelo que se lanza al terminar la cutscene de emboscada. */
export const HYDRA_AMBUSH_DUEL_ID = "story-ch4-duel-8";
/**
 * Nodo de ENTRADA del maze de la Hydra (leftUp): la boca del laberinto por la que se accede desde el
 * laberinto 2. Es el extremo "hacia fuera" al trazar el pasillo (GenNvim llega desde ahí).
 */
export const HYDRA_MAZE_ENTRY_TILE = { tileX: 14, tileY: 29 } as const;

// ── FÁBRICA DE CARTAS (mitad ALTA de la sala del terminal, fuera del laberinto) ───────────────────────────────
// La máquina ya no cuelga de un nicho del medio laberinto: preside la mitad alta de la sala, contra la pared de
// arriba y a la vista nada más salir del maze. Ocupa DOS casillas (mitad izquierda + derecha del mismo chasis).
/** Fila de la MÁQUINA (pared alta de la sala) y fila donde esperan los villanos, justo debajo mirando hacia ella. */
const CARD_FORGE_MACHINE_TILE_Y = 13;
const CARD_FORGE_VILLAIN_TILE_Y = 14;
/** GenNvim, el más cercano a la boca del laberinto: es el que se gira y viene a por ti. */
export const CARD_FORGE_GENNVIM_TILE = { tileX: 24, tileY: CARD_FORGE_VILLAIN_TILE_Y } as const;
/** Midutech, al otro lado: suelta su línea, se lleva la carta y se desmaterializa. */
export const CARD_FORGE_MIDUTECH_TILE = { tileX: 23, tileY: CARD_FORGE_VILLAIN_TILE_Y } as const;
/**
 * Distancia máxima (en casillas de pasillo) entre el trigger de la escena y GenNvim. El trigger es la casilla a
 * la que se sale del medio laberinto —ruta obligatoria, así que la escena no se puede saltar— y la Fábrica queda
 * enfrente: si un cambio de semilla la alejara, la escena arrancaría fuera de cámara.
 */
export const CARD_FORGE_MAX_TILES_FROM_MACHINE = 5;
/** Id del trigger oculto que lanza la escena de la Fábrica (y del diálogo de los tres villanos). */
export const CARD_FORGE_TRIGGER_ID = "story-ch4-event-card-forge";
/**
 * Los dos villanos también existen como ATREZZO fijo: se ven plantados ante la máquina desde que asomas a la
 * sala, en vez de materializarse de golpe al saltar la escena. Al arrancar la cutscene se ocultan y toman el
 * relevo los NPCs guionizados (que ya sí se mueven); tras vencer a duel-10 no se vuelven a dibujar.
 */
export const CARD_FORGE_SCENERY_GENNVIM_ID = "story-ch4-npc-forge-gennvim";
export const CARD_FORGE_SCENERY_MIDUTECH_ID = "story-ch4-npc-forge-midutech";
/** Id del duelo con GenNvim al terminar la escena. */
export const CARD_FORGE_DUEL_ID = "story-ch4-duel-10";

/**
 * Portal al Acto 5 al final de la sala del jefe. Es un WARP **sin destino** a propósito: el Acto 5 no existe
 * todavía, así que al usarlo se cuenta que el Core sigue en construcción en vez de saltar de mapa.
 */
export const ACT_5_PORTAL_ID = "story-ch4-transition-to-act5";

// Avatares (ya existen en assets). GenNvim reutiliza el del apprentice; Midutech el del oponente de arena.
const SOLDADO = "/assets/story/opponents/opp-ch4-soldado-terminal/avatar-Soldado-terminal.webp";
const GENNVIM = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp";
const MIDUTECH = "/assets/story/opponents/opp-ch1-midutech/avatar-Midutech.webp";
// Objetos de recompensa (arte ya existente en /assets/items/).
const USB = "/assets/items/candy-usb-raro.webp";
const ATK_AUGMENT = "/assets/items/item-nucleo-overclock.webp";
const DEF_AUGMENT = "/assets/items/item-placa-blindada.webp";
// Arte de las cartas de recompensa (para que el nodo del mapa muestre la propia carta).
const CARD_ANTIGRABITY = "/assets/renders/antigrabity.webp";
const CARD_HYDRA = "/assets/renders/executions/exec-hydra-attack-down.webp";

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
  wallKind?: number; // atrezzo de los muros del maze (por defecto SERVER_RACK)
}
interface IMazeHandle {
  nodeX: (i: number) => number;
  nodeY: (j: number) => number;
  carve: (x: number, y: number) => void;
  findDeadEnd: (reserved: Set<string>, fallback: [number, number]) => [number, number];
  // Callejón sin salida MÁS LEJANO (en casillas de pasillo recorridas) desde una celda de entrada. Para esconder
  // algo "al fondo del todo" en vez de en el primer callejón que aparezca al barrer la malla.
  findFarthestDeadEnd: (
    fromTile: [number, number],
    reserved: Set<string>,
    fallback: [number, number],
  ) => [number, number];
  // Dada la celda de un nodo (x,y), devuelve la ÚNICA celda-pasillo transitable contigua (para un callejón de
  // grado 1 es su acceso). Sirve para plantar un rival sólido que bloquee el único camino a un callejón.
  openApproach: (x: number, y: number) => [number, number] | null;
  // Todas las celdas transitables contiguas a (x,y). Con `length === 1` la celda es un callejón sin salida:
  // sirve para AFIRMAR la topología (que un nicho lo siga siendo) sin depender de leer el mapa a ojo.
  openNeighbors: (x: number, y: number) => Array<[number, number]>;
}

/**
 * Talla un LABERINTO REAL (maze perfecto) en el rectángulo dado: tapia el cuerpo con servidores y abre pasillos
 * de 1 casilla con un backtracker recursivo determinista (mulberry32 con semilla fija) -> bifurcaciones, cruces y
 * CALLEJONES SIN SALIDA (un único camino correcto entre dos puntos). El caller abre los "breach" de entrada/salida
 * y coloca objetos en callejones (findDeadEnd) o salas laterales.
 */
function carveMaze(map: IMutableTilemap, spec: IMazeSpec): IMazeHandle {
  const { bodyY0, bodyY1, nodeX0, nodeY0, cols, rows, seed, start } = spec;
  const wallKind = spec.wallKind ?? OVERLAY_TILE.SERVER_RACK;
  const nodeX = (i: number): number => nodeX0 + 2 * i;
  const nodeY = (j: number): number => nodeY0 + 2 * j;
  const carve = (x: number, y: number): void => {
    map.overlay[y][x] = 0;
    map.collision[y][x] = 1;
  };
  // 1) Tapiar el cuerpo; 2) vaciar los nodos de la malla.
  for (let y = bodyY0; y <= bodyY1; y++) for (let x = nodeX(0); x <= nodeX(cols - 1); x++) {
    placeStructure(map, x, y, wallKind);
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
  const findFarthestDeadEnd = (
    fromTile: [number, number],
    reserved: Set<string>,
    fallback: [number, number],
  ): [number, number] => {
    let best: [number, number] | null = null;
    let bestDistance = -1;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (reserved.has(`${i},${j}`) || degree(i, j) !== 1) continue;
        const tile: [number, number] = [nodeX(i), nodeY(j)];
        const distance = traceWalkableCorridor(
          map.collision,
          { tileX: fromTile[0], tileY: fromTile[1] },
          { tileX: tile[0], tileY: tile[1] },
        ).length;
        if (distance > bestDistance) {
          bestDistance = distance;
          best = tile;
        }
      }
    }
    return best ?? fallback;
  };
  const openNeighbors = (x: number, y: number): Array<[number, number]> => {
    const neighbors: Array<[number, number]> = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
      if (map.collision[y + dy]?.[x + dx] === 1) neighbors.push([x + dx, y + dy]);
    }
    return neighbors;
  };
  const openApproach = (x: number, y: number): [number, number] | null => openNeighbors(x, y)[0] ?? null;
  return { nodeX, nodeY, carve, findDeadEnd, findFarthestDeadEnd, openApproach, openNeighbors };
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
  carveCorridor(map, { x: 15, y: 29 }, { x: 17, y: 29 }); // laberinto 2 -> maze leftUp (carta Hydra, guardia duel-4)
  carveCorridor(map, { x: 35, y: 29 }, { x: 37, y: 29 }); // laberinto 2 -> maze rightUp (sala opcional con nodo de evento)

  // Embudo de salida (y=25/26): pared de servidores con hueco SOLO en x=26. La cámara (y=27) queda abierta, pero el
  // puente que sube (cinta) va EN CONTRA: no se sube hasta accionar el INTERRUPTOR del laberinto 2 (belt-toggle),
  // que invierte la pasarela. Es REVERSIBLE: hay un SEGUNDO interruptor arriba (en el terminal) que la vuelve a
  // bajar, para poder regresar (si no, la pasarela subiendo te rebota y quedarías atrapado arriba).
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
  // CENTINELA MÓVIL del laberinto 1 (duel-9): el maze deja de ser estático. Vive en el NICHO sin salida que
  // cuelga del corredor de salida (nodos i2 de la malla): asoma al pasillo y se vuelve a meter. Patrulla en
  // VERTICAL, así que su haz barre el corredor de lado a lado (`patrolSweep`); cuando está arriba vigila hacia
  // la izquierda, que es por donde llega el jugador camino de la salida, y cuando se agacha se puede cruzar.
  const sentinelTile = { tileX: hubMaze.nodeX(2), tileY: hubMaze.nodeY(0) };
  const sentinelNookTile = { tileX: hubMaze.nodeX(2), tileY: hubMaze.nodeY(1) };
  const sentinelPatrolLength = (sentinelNookTile.tileY - sentinelTile.tileY) as number; // 2 celdas: pasillo -> fondo del nicho
  // El nicho DEBE seguir siendo un callejón que sólo sube hacia el corredor: si el maze cambiara de semilla y
  // esto pasara a ser un cruce, el centinela patrullaría por una ruta viva. Se comprueba, no se supone.
  const sentinelNookNeighbors = hubMaze.openNeighbors(sentinelNookTile.tileX, sentinelNookTile.tileY);
  if (
    sentinelNookNeighbors.length !== 1 ||
    sentinelNookNeighbors[0][0] !== sentinelTile.tileX ||
    sentinelNookNeighbors[0][1] !== sentinelNookTile.tileY - 1
  ) {
    throw new Error("act-4-overworld: el nicho del centinela del laberinto 1 ya no es un callejón hacia el corredor.");
  }

  // LABERINTO leftLow (rama izq baja, x=4..15, y=47..55): maze que guarda el AUMENTO ATK. Nodos 6x3 en
  // x=4,6,8,10,12,14 / y=49,51,53. Entra desde el laberinto 1 por el corredor (15,51)-(17,51) (guardado por duel-2
  // en (16,51)) hasta el nodo (14,51)=(i5,j1). El aumento ATK va en un callejón sin salida.
  const leftLowMaze = carveMaze(map, { bodyY0: 47, bodyY1: 55, nodeX0: 4, nodeY0: 49, cols: 6, rows: 3, seed: 0x2c9f4e11, start: [5, 1] });
  const [atkTileX, atkTileY] = leftLowMaze.findDeadEnd(new Set(["5,1"]), [4, 49]);

  // LABERINTO rightLow (rama der baja, x=37..48, y=47..55): maze que guarda el AUMENTO DEF. Nodos 6x3 en
  // x=38,40,42,44,46,48 / y=49,51,53. Entra desde el laberinto 1 por el corredor (35,51)-(36,51) (guardado por
  // duel-3 en (36,51)) hasta el nodo (38,51)=(i0,j1). El aumento DEF va en un callejón sin salida.
  const rightLowMaze = carveMaze(map, { bodyY0: 47, bodyY1: 55, nodeX0: 38, nodeY0: 49, cols: 6, rows: 3, seed: 0x5d8a3b22, start: [0, 1] });
  const [defTileX, defTileY] = rightLowMaze.findDeadEnd(new Set(["0,1"]), [48, 49]);
  // Las salas bajas son de ancho PAR (12): el maze (ancho impar) deja una franja de suelo sobrante en el borde
  // interior (x=15 en leftLow, x=37 en rightLow). La tapiamos salvo la casilla de entrada (y=51), para que la
  // entrada sea una sola celda y el aumento quede DENTRO del laberinto (sin pasillo abierto que lo rodee).
  for (let y = 47; y <= 55; y++) if (y !== 51) placeStructure(map, 15, y, OVERLAY_TILE.SERVER_RACK);
  for (let y = 47; y <= 55; y++) if (y !== 51) placeStructure(map, 37, y, OVERLAY_TILE.COOLING_UNIT);

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

  // LABERINTO leftUp (sala izq alta, x=4..14, y=25..33): maze real que guarda la carta HYDRA. Nodos 6x3 en
  // x=4,6,8,10,12,14 / y=27,29,31. La entrada viene del laberinto 2 por el corredor (15,29)-(17,29) (guardado por
  // duel-4 en (16,29)) hasta el nodo (14,29)=(i5,j1), ya contiguo al corredor.
  const hydraMaze = carveMaze(map, { bodyY0: 25, bodyY1: 33, nodeX0: 4, nodeY0: 27, cols: 6, rows: 3, seed: 0x4a3d1b7e, start: [5, 1] });
  // Carta HYDRA en el callejón sin salida más profundo (reservando el nodo de entrada).
  const [hydraTileX, hydraTileY] = hydraMaze.findDeadEnd(new Set(["5,1"]), [4, 27]);
  // Única celda de acceso al callejón de la Hydra: desde ahí se coge la carta (pulsando al lado).
  const hydraApproach = hydraMaze.openApproach(hydraTileX, hydraTileY) ?? [hydraTileX - 1, hydraTileY];
  const [duel8TileX, duel8TileY] = hydraApproach;
  // EMBOSCADA de GenNvim (duel-8): ya no espera plantado en el pasillo (se veía venir desde la entrada del
  // maze). Ahora el pasillo está vacío y, DOS casillas antes de poder coger la carta, un trigger oculto lanza
  // la cutscene: GenNvim aparece por detrás (cortando la retirada), narra y arranca el combate. El corredor se
  // traza sobre la rejilla (no hay coordenadas a mano) desde el acceso a la carta hacia la entrada del maze.
  const hydraCorridor = traceWalkableCorridor(map.collision, { tileX: duel8TileX, tileY: duel8TileY }, HYDRA_MAZE_ENTRY_TILE);
  const ambushTile = hydraCorridor[Math.min(HYDRA_AMBUSH_TILES_BEFORE_CARD, hydraCorridor.length - 1)] ?? {
    tileX: duel8TileX,
    tileY: duel8TileY,
  };

  // LABERINTO rightUp (sala der alta, x=38..48, y=25..33): maze con atrezzo distinto (unidades de refrigeración
  // en vez de racks). En el callejón MÁS PROFUNDO (el que queda más lejos de la boca, no el primero que salga al
  // barrer la malla) vive el INTERRUPTOR de la pasarela, y su único acceso lo guarda un centinela (duel-5): la
  // sala pasa de adorno a etapa obligatoria de verdad. Nodos 6x3 en x=38,40,42,44,46,48 / y=27,29,31.
  // Entra desde el laberinto 2 por el corredor (35,29)-(37,29) hasta el nodo (38,29)=(i0,j1).
  const rightUpMaze = carveMaze(map, { bodyY0: 25, bodyY1: 33, nodeX0: 38, nodeY0: 27, cols: 6, rows: 3, seed: 0x7f2e9a15, start: [0, 1], wallKind: OVERLAY_TILE.COOLING_UNIT });
  const [beltSwitchTileX, beltSwitchTileY] = rightUpMaze.findFarthestDeadEnd([38, 29], new Set(["0,1"]), [48, 27]);
  // El centinela ocupa la ÚNICA celda de acceso al callejón del interruptor: sin vencerlo no se acciona la
  // pasarela y, por tanto, no se sube al terminal (mismo patrón que los guardias de los aumentos ATK/DEF).
  const [switchGuardTileX, switchGuardTileY] = rightUpMaze.openApproach(beltSwitchTileX, beltSwitchTileY) ?? [
    beltSwitchTileX - 1,
    beltSwitchTileY,
  ];
  // Mira hacia fuera del callejón (hacia donde llega el jugador), para que su haz de visión barra el pasillo.
  const switchGuardFacing: OverworldDirection =
    switchGuardTileX === beltSwitchTileX
      ? switchGuardTileY > beltSwitchTileY
        ? "DOWN"
        : "UP"
      : switchGuardTileX > beltSwitchTileX
        ? "RIGHT"
        : "LEFT";

  // MEDIO LABERINTO del terminal (mitad baja de la sala, y=16..21). La mitad alta (y=13..15) queda despejada:
  // es la nave donde preside la FÁBRICA DE CARTAS y donde vive el interruptor gemelo de la pasarela.
  // El maze ocupa x=22..32 (nodos en x=22,24,...,32 / y=17,19,21). Se entra por abajo desde la cinta, que
  // desemboca en el nodo (26,21), y se sale por el breach (22,16) hacia la mitad alta.
  const forgeMaze = carveMaze(map, { bodyY0: 16, bodyY1: 21, nodeX0: 22, nodeY0: 17, cols: 6, rows: 3, seed: 0x3e7b19c4, start: [2, 2] });
  // La SALIDA se abre sobre el nodo (22,17), en la esquina: quien sale del maze desemboca de frente a la Fábrica.
  const forgeExitTile = { tileX: forgeMaze.nodeX(0), tileY: forgeMaze.nodeY(0) };
  forgeMaze.carve(forgeExitTile.tileX, forgeExitTile.tileY - 1); // breach hacia la mitad alta del terminal
  // Franja izquierda de la sala (x=20..21) fuera de la malla: se tapia entera (ya no hay nicho que tallar).
  for (let tileY = 16; tileY <= 21; tileY++) {
    for (const tileX of [20, 21]) placeStructure(map, tileX, tileY, OVERLAY_TILE.SERVER_RACK);
  }
  // LA MÁQUINA: dos casillas contiguas contra la pared alta de la sala (mitad izquierda + derecha del mismo
  // chasis), con los villanos justo debajo mirándola. Es lo primero que se ve al salir del laberinto.
  placeStructure(map, CARD_FORGE_MIDUTECH_TILE.tileX, CARD_FORGE_MACHINE_TILE_Y, OVERLAY_TILE.CARD_FORGE);
  placeStructure(map, CARD_FORGE_GENNVIM_TILE.tileX, CARD_FORGE_MACHINE_TILE_Y, OVERLAY_TILE.CARD_FORGE_RIGHT);
  // El trigger de la escena es la casilla a la que se sale del laberinto (única conexión con la mitad alta): al
  // pisarla, el jugador tiene la Fábrica enfrente y ve la escena entera.
  const forgeTriggerTile = { tileX: forgeExitTile.tileX, tileY: forgeExitTile.tileY - 2 };

  // Puente lab -> terminal: cinta EN CONTRA (empuja hacia abajo). No se sube hasta accionar el interruptor de la
  // cámara (belt-toggle), que la invierte. El interruptor es REVERSIBLE (toggle en runtime) y hay otro gemelo en
  // el terminal: subes con el de abajo y bajas con el de arriba. Sin soft-lock (siempre alcanzas un interruptor).
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
  markSolid(map, beltSwitchTileX, beltSwitchTileY); // INTERRUPTOR (abajo) del puente, al fondo del maze rightUp
  markSolid(map, switchGuardTileX, switchGuardTileY); // duel-5: centinela que guarda ese callejón
  markSolid(map, 30, 14); // INTERRUPTOR (arriba) gemelo, en la mitad ALTA del terminal (fuera del medio laberinto)

  // Recompensas (pulsar A al lado): USB (laberinto 2) + carta ANTIGRABITY (laberinto 1) + aumentos ATK/DEF.
  markSolid(map, usbTileX, usbTileY); // USB Raro (callejón sin salida del laberinto 2)
  markSolid(map, cardTileX, cardTileY); // carta ANTIGRABITY (callejón sin salida del laberinto 1)
  markSolid(map, hydraTileX, hydraTileY); // carta HYDRA (callejón sin salida del maze leftUp, tras duel-8)
  markSolid(map, atkTileX, atkTileY); // aumento de ATAQUE (callejón del maze leftLow, tras el guardia duel-2)
  markSolid(map, defTileX, defTileY); // aumento de DEFENSA (callejón del maze rightLow, tras el guardia duel-3)

  // Rivales (sólidos): al vencerlos se teletransportan y liberan su casilla.
  markSolid(map, 26, 61); // duel-1 Soldado-Terminal (corredor de entrada, chokepoint único)
  markSolid(map, 16, 51); // duel-2 (rama izq del laberinto 1, guardia del aumento ATK)
  markSolid(map, 36, 51); // duel-3 (rama der del laberinto 1, guardia del aumento DEF)
  markSolid(map, 16, 29); // duel-4 (rama izq del laberinto 2, guardia de la ENTRADA del maze de la Hydra)
  // duel-8 (GenNvim) NO ocupa casilla: aparece por cutscene en la emboscada del pasillo de la Hydra.
  // duel-9 (centinela que patrulla el laberinto 1) TAMPOCO: si ocupara casilla sellaría el corredor de salida.
  // duel-6 (GenNvim como jefe) YA NO EXISTE: se le vence en la escena de la Fábrica (duel-10). La mitad baja de
  // la sala del jefe queda despejada como antesala de Midutech.
  markSolid(map, 26, 4); // duel-7 Midutech (boss final, mitad alta, tras la puerta post-jefe)
  // Muro de atrezzo que parte la sala del jefe en dos; hueco en x=26 con la puerta post-GenNvim.
  for (let x = 18; x <= 34; x++) if (x !== 26) placeStructure(map, x, 6, OVERLAY_TILE.SERVER_RACK);

  // La consola E4 (registro-madre) YA NO EXISTE: su hueco de la mitad alta lo ocupa ahora la Fábrica de Cartas,
  // que cuenta lo mismo (y mejor) en la escena de GenNvim + Midutech.

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

      // ── El puente que sube (cinta) va EN CONTRA. Los DOS interruptores son las dos posiciones de UNA palanca
      // sobre el mismo rect de cinta: el de abajo la INVIERTE (se sube) y el gemelo del terminal la RESTAURA (se
      // baja). Siempre hay exactamente uno encendido —se ve en el propio dibujo del interruptor—, y pulsar el que
      // ya manda no hace nada. El de abajo vive en el callejón de la sala derecha alta: esa sala deja de ser un
      // adorno y hay que recorrer su laberinto para poder subir.
      { id: "story-ch4-belt-switch", kind: "SWITCH", tileX: beltSwitchTileX, tileY: beltSwitchTileY, sprite: "switch", trigger: "ADJACENT_ACTION", beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 }, beltToggleMode: "INVERT" },
      // Interruptor GEMELO en el terminal: devuelve la pasarela a su sentido base para poder bajar. Evita quedar
      // atrapado arriba (la pasarela subiendo te rebota al intentar bajar).
      { id: "story-ch4-belt-switch-top", kind: "SWITCH", tileX: 30, tileY: 14, sprite: "switch", trigger: "ADJACENT_ACTION", beltToggleRect: { x0: 26, y0: 22, x1: 26, y1: 24 }, beltToggleMode: "RESTORE" },
      // Compuerta terminal->jefe: requiere vencer al centinela de antesala (duel-5).
      { id: "story-a4-gate-boss", kind: "GATE", tileX: 26, tileY: 12, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: ["story-ch4-duel-5"] },

      // ── Rivales (ids reales del capítulo 4; duelHref -> /hub/story/chapter/4/duel/N) ─────────────────
      // 1-5: Soldado-Terminal (centinelas). 6: GenNvim (boss 1). 7: Midutech (boss final).
      { id: "story-ch4-duel-1", kind: "DUEL", tileX: 26, tileY: 61, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/1", imageSrc: SOLDADO, facing: "DOWN", visionRange: 3 },
      { id: "story-ch4-duel-2", kind: "DUEL", tileX: 16, tileY: 51, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/2", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      { id: "story-ch4-duel-3", kind: "DUEL", tileX: 36, tileY: 51, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/3", imageSrc: SOLDADO, facing: "LEFT", visionRange: 3 },
      { id: "story-ch4-duel-4", kind: "DUEL", tileX: 16, tileY: 29, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/4", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3 },
      // duel-5: ya no vigila el terminal (ese hueco es ahora la Fábrica), sino el callejón del INTERRUPTOR de la
      // pasarela en el maze rightUp. Como sin interruptor no se sube, sigue siendo obligatorio (y la compuerta
      // del jefe, que lo exige, queda abierta al llegar arriba).
      { id: "story-ch4-duel-5", kind: "DUEL", tileX: switchGuardTileX, tileY: switchGuardTileY, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/5", imageSrc: SOLDADO, facing: switchGuardFacing, visionRange: 3 },
      { id: "story-ch4-duel-7", kind: "BOSS", tileX: 26, tileY: 4, sprite: "midutech", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/7", imageSrc: MIDUTECH, facing: "DOWN", visionRange: 3, visionRect: { x0: 18, y0: 3, x1: 34, y1: 5 } },
      // duel-8: GenNvim (DUEL, no BOSS) custodia la carta Hydra. NO se dibuja ni bloquea el pasillo: es un nodo
      // "fantasma" (hidden, sin visionRange → sin actor) que solo existe para el combate que lanza la cutscene de
      // emboscada. Su casilla nominal es el acceso al callejón, para que el nodo viva donde ocurre la escena.
      { id: HYDRA_AMBUSH_DUEL_ID, kind: "DUEL", tileX: duel8TileX, tileY: duel8TileY, sprite: "gennvim", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/8", imageSrc: GENNVIM, facing: "DOWN", hidden: true },
      // duel-9: CENTINELA que patrulla el laberinto 1. A propósito NO lleva markSolid: un rival sólido paseando
      // por un pasillo de una casilla podría sellar el maze, y aquí patrulla justo sobre la ruta de salida. Al no
      // ocupar casilla nunca bloquea nada; el reto es cruzar el corredor cuando su haz está mirando al otro lado.
      // `facing: "RIGHT"` es la orientación INICIAL: con patrolSweep, al rebotar queda mirando a la izquierda
      // (hacia la llegada del jugador) cada vez que asoma al pasillo.
      { id: "story-ch4-duel-9", kind: "DUEL", tileX: sentinelTile.tileX, tileY: sentinelTile.tileY, sprite: "soldado-terminal", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/9", imageSrc: SOLDADO, facing: "RIGHT", visionRange: 3, patrolAxis: "V", patrolLength: sentinelPatrolLength, patrolSweep: true },
      // duel-10: GenNvim en la FÁBRICA DE CARTAS. Como duel-8, es un nodo "fantasma" (hidden, sin visionRange →
      // sin actor, sin markSolid): existe sólo para el combate que lanza la escena. Su casilla nominal es donde
      // GenNvim ACABA la cutscene (pegado al jugador), no donde empieza: ahí está su atrezzo y dos objetos no
      // pueden compartir celda.
      { id: CARD_FORGE_DUEL_ID, kind: "DUEL", tileX: CARD_FORGE_MIDUTECH_TILE.tileX - 1, tileY: CARD_FORGE_VILLAIN_TILE_Y, sprite: "gennvim", trigger: "ADJACENT_ACTION", duelHref: "/hub/story/chapter/4/duel/10", imageSrc: GENNVIM, facing: "DOWN", hidden: true },
      // ATREZZO de la Fábrica: los dos villanos, ya plantados ante la máquina antes de que salte la escena (no
      // aparecen de la nada). NO son sólidos —los NPCs guionizados pasan por encima de sus casillas— y la escena
      // los oculta al arrancar para que tomen el relevo los que sí se mueven.
      { id: CARD_FORGE_SCENERY_MIDUTECH_ID, kind: "NPC", tileX: CARD_FORGE_MIDUTECH_TILE.tileX, tileY: CARD_FORGE_MIDUTECH_TILE.tileY, sprite: "midutech", trigger: "ADJACENT_ACTION", imageSrc: MIDUTECH, facing: "UP" },
      { id: CARD_FORGE_SCENERY_GENNVIM_ID, kind: "NPC", tileX: CARD_FORGE_GENNVIM_TILE.tileX, tileY: CARD_FORGE_GENNVIM_TILE.tileY, sprite: "gennvim", trigger: "ADJACENT_ACTION", imageSrc: GENNVIM, facing: "UP" },

      // ── Recompensas: USB + aumentos ATK/DEF (objetos) + carta ANTIGRABITY (recompensa de carta) ──────
      { id: "story-ch4-cache-usb", kind: "REWARD_OBJECT", tileX: usbTileX, tileY: usbTileY, sprite: "usb-raro", trigger: "ADJACENT_ACTION", imageSrc: USB },
      { id: "story-ch4-cache-atk", kind: "REWARD_OBJECT", tileX: atkTileX, tileY: atkTileY, sprite: "atk-augment", trigger: "ADJACENT_ACTION", imageSrc: ATK_AUGMENT },
      { id: "story-ch4-cache-def", kind: "REWARD_OBJECT", tileX: defTileX, tileY: defTileY, sprite: "def-augment", trigger: "ADJACENT_ACTION", imageSrc: DEF_AUGMENT },
      // Carta ANTIGRABITY escondida en un rincón del laberinto 1; el nodo muestra el arte de la carta y al cogerla
      // se revela la Card real y luego salta el aviso de BigLog.
      { id: "story-ch4-card-antigrabity", kind: "REWARD_CARD", tileX: cardTileX, tileY: cardTileY, sprite: "card", trigger: "ADJACENT_ACTION", imageSrc: CARD_ANTIGRABITY },
      // Carta HYDRA al fondo del maze leftUp. Ya no la tapa el cuerpo de GenNvim (ahora emboscada), así que el
      // candado es explícito: sin duel-8 vencido el nodo está bloqueado y no se puede reclamar.
      { id: "story-ch4-card-hydra", kind: "REWARD_CARD", tileX: hydraTileX, tileY: hydraTileY, sprite: "card", trigger: "ADJACENT_ACTION", imageSrc: CARD_HYDRA, gateRequiredNodeIds: [HYDRA_AMBUSH_DUEL_ID] },

      // ── Puerta post-GenNvim: abre al haberle vencido en la FÁBRICA (duel-10); sella a Midutech ───────
      { id: "story-a4-gate-postboss", kind: "GATE", tileX: 26, tileY: 6, sprite: "gate", trigger: "ADJACENT_ACTION", gateRequiredNodeIds: [CARD_FORGE_DUEL_ID] },

      // ── Eventos narrativos ────────────────────────────────────────────────────────────────────────
      // (La consola E4 "registro-madre" se eliminó: la escena de la Fábrica cuenta esa revelación.)
      // Triggers ocultos (se pisan, una vez): E5 tras vencer a GenNvim (celda naturalmente sellada por su casilla
      // sólida) y E6 tras Midutech. La pasarela NO narra nada: el jugador descubre solo que la cinta va en contra.
      // EMBOSCADA de la Hydra: trigger oculto DOS casillas antes del acceso a la carta. Al pisarlo, GenNvim
      // aparece por detrás (teletransporte en desktop / entrando andando en móvil), narra y arranca duel-8.
      { id: HYDRA_AMBUSH_TRIGGER_ID, kind: "EVENT", tileX: ambushTile.tileX, tileY: ambushTile.tileY, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      // FÁBRICA DE CARTAS: trigger oculto a dos casillas de la máquina. Al pisarlo aparecen GenNvim y Midutech
      // de espaldas, mirando la forja; hablan, Midutech se lleva la carta y se desmaterializa, y GenNvim se gira
      // hacia ti con el callejón a tu espalda → duel-10.
      { id: CARD_FORGE_TRIGGER_ID, kind: "EVENT", tileX: forgeTriggerTile.tileX, tileY: forgeTriggerTile.tileY, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-pre-midutech", kind: "EVENT", tileX: 26, tileY: 7, sprite: "hidden", trigger: "STEP_ON", hidden: true },
      { id: "story-ch4-event-core-key", kind: "EVENT", tileX: 26, tileY: 3, sprite: "hidden", trigger: "STEP_ON", hidden: true },

      // ── Portal al Acto 5: SIN destino a propósito (el acto no existe todavía). Se dibuja como portal y, al
      // usarlo, cuenta que el Core sigue en construcción. Sólo accesible tras vencer a Midutech.
      { id: ACT_5_PORTAL_ID, kind: "WARP", tileX: 28, tileY: 3, sprite: "portal", trigger: "STEP_ON", gateRequiredNodeIds: ["story-ch4-duel-7"] },
    ],
    spawns: [{ id: "spawn-entry", tileX: 26, tileY: 66, facing: "UP" }],
    defaultSpawnId: "spawn-entry",
  });
}

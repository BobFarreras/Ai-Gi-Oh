// src/services/story/overworld/validate-tilemap.ts - Validación estricta del tilemap JSON antes de entrar al motor.
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IOverworldTilemap,
  IOverworldTilemapObject,
  IOverworldTilemapSpawn,
  OVERWORLD_TILEMAP_SCHEMA_VERSION,
  OverworldObjectKind,
  OverworldObjectTrigger,
  OverworldTileLayer,
} from "@/services/story/overworld/tilemap-schema";

/** Límites duros anti-abuso: un JSON manipulado no puede agotar memoria ni CPU. */
const MAX_MAP_DIMENSION = 512;
const MIN_TILE_SIZE = 8;
const MAX_TILE_SIZE = 256;
const MAX_OBJECTS = 512;
const MAX_SPAWNS = 64;

const VALID_KINDS: ReadonlySet<OverworldObjectKind> = new Set([
  "DUEL",
  "BOSS",
  "REWARD_CARD",
  "REWARD_NEXUS",
  "REWARD_OBJECT",
  "EVENT",
  "NPC",
  "SUBMISSION",
  "WARP",
  "GATE",
  "MARKET",
  "ARSENAL",
  "TELEPORT",
  "SWITCH",
  "BOX",
  "PLATE",
  "BOX_RESET",
]);
const VALID_AMBIENTS = new Set(["NORMAL", "DARK"]);
const VALID_TRIGGERS: ReadonlySet<OverworldObjectTrigger> = new Set([
  "ADJACENT_ACTION",
  "STEP_ON",
  "BUMP",
]);
const VALID_FACINGS = new Set(["UP", "DOWN", "LEFT", "RIGHT"]);
const VALID_WARP_DIRECTIONS = new Set(["forward", "backward"]);

function fail(path: string, reason: string): never {
  throw new ValidationError(`Tilemap inválido en ${path}: ${reason}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(path, "se esperaba un string no vacío");
  }
  return value;
}

function assertBoundedInteger(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    fail(path, `se esperaba un entero entre ${min} y ${max}`);
  }
  return value;
}

function assertInternalAssetPath(value: unknown, path: string): string {
  const asset = assertNonEmptyString(value, path);
  // Solo assets internos: bloquea URLs externas y path traversal.
  if (!asset.startsWith("/") || asset.startsWith("//") || asset.includes("..")) {
    fail(path, "solo se permiten rutas internas absolutas sin '..'");
  }
  return asset;
}

function assertLayerMatrix(
  value: unknown,
  path: string,
  width: number,
  height: number,
  maxCellValue: number,
): OverworldTileLayer {
  if (!Array.isArray(value) || value.length !== height) {
    fail(path, `se esperaba una matriz de ${height} filas`);
  }
  for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
    const row: unknown = value[rowIndex];
    if (!Array.isArray(row) || row.length !== width) {
      fail(`${path}[${rowIndex}]`, `se esperaba una fila de ${width} celdas`);
    }
    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const cell: unknown = row[columnIndex];
      if (typeof cell !== "number" || !Number.isInteger(cell) || cell < 0 || cell > maxCellValue) {
        fail(`${path}[${rowIndex}][${columnIndex}]`, `se esperaba un entero entre 0 y ${maxCellValue}`);
      }
    }
  }
  return value as OverworldTileLayer;
}

function isWalkableCell(collision: number[][], tileX: number, tileY: number): boolean {
  return collision[tileY]?.[tileX] === 1;
}

function validateObject(
  raw: unknown,
  path: string,
  width: number,
  height: number,
  collision: number[][],
): IOverworldTilemapObject {
  if (!isRecord(raw)) fail(path, "se esperaba un objeto");
  const id = assertNonEmptyString(raw.id, `${path}.id`);
  const kindValue = assertNonEmptyString(raw.kind, `${path}.kind`);
  if (!VALID_KINDS.has(kindValue as OverworldObjectKind)) {
    fail(`${path}.kind`, `kind desconocido '${kindValue}'`);
  }
  const kind = kindValue as OverworldObjectKind;
  const tileX = assertBoundedInteger(raw.tileX, `${path}.tileX`, 0, width - 1);
  const tileY = assertBoundedInteger(raw.tileY, `${path}.tileY`, 0, height - 1);
  const sprite = assertNonEmptyString(raw.sprite, `${path}.sprite`);
  const triggerValue = assertNonEmptyString(raw.trigger, `${path}.trigger`);
  if (!VALID_TRIGGERS.has(triggerValue as OverworldObjectTrigger)) {
    fail(`${path}.trigger`, `trigger desconocido '${triggerValue}'`);
  }
  const trigger = triggerValue as OverworldObjectTrigger;

  // Los objetos que se pisan (STEP_ON) y las puertas deben ocupar celdas transitables:
  // una puerta sobre celda bloqueada jamás se abriría físicamente. Las cajas (BOX) y placas
  // (PLATE) también viven sobre suelo transitable: la caja se empuja a celdas caminables y
  // tanto caja como jugador pueden pisar la placa.
  if (
    (trigger === "STEP_ON" || kind === "GATE" || kind === "WARP" || kind === "BOX" || kind === "PLATE") &&
    !isWalkableCell(collision, tileX, tileY)
  ) {
    fail(path, `el objeto '${id}' (${kind}) debe estar sobre una celda transitable`);
  }

  let gateRequiredNodeIds: string[] | undefined;
  if (raw.gateRequiredNodeIds !== undefined) {
    if (!Array.isArray(raw.gateRequiredNodeIds)) {
      fail(`${path}.gateRequiredNodeIds`, "se esperaba un array de ids");
    }
    gateRequiredNodeIds = raw.gateRequiredNodeIds.map((entry, index) =>
      assertNonEmptyString(entry, `${path}.gateRequiredNodeIds[${index}]`),
    );
  }
  if (kind === "GATE" && (!gateRequiredNodeIds || gateRequiredNodeIds.length === 0)) {
    fail(path, `la puerta '${id}' necesita al menos un requisito en gateRequiredNodeIds`);
  }

  let warp: IOverworldTilemapObject["warp"];
  if (kind === "WARP") {
    if (!isRecord(raw.warp)) fail(`${path}.warp`, "un objeto WARP necesita destino");
    const toMapId = assertNonEmptyString(raw.warp.toMapId, `${path}.warp.toMapId`);
    const toSpawnId = assertNonEmptyString(raw.warp.toSpawnId, `${path}.warp.toSpawnId`);
    const direction = assertNonEmptyString(raw.warp.direction, `${path}.warp.direction`);
    if (!VALID_WARP_DIRECTIONS.has(direction)) {
      fail(`${path}.warp.direction`, "se esperaba 'forward' o 'backward'");
    }
    warp = { toMapId, toSpawnId, direction: direction as "forward" | "backward" };
  } else if (raw.warp !== undefined) {
    fail(`${path}.warp`, `solo los objetos WARP admiten destino (kind actual: ${kind})`);
  }

  let duelHref: string | undefined;
  if (raw.duelHref !== undefined) {
    duelHref = assertInternalAssetPath(raw.duelHref, `${path}.duelHref`);
  }
  if ((kind === "DUEL" || kind === "BOSS") && !duelHref) {
    fail(path, `el objeto '${id}' (${kind}) necesita duelHref`);
  }

  let imageSrc: string | undefined;
  if (raw.imageSrc !== undefined) {
    imageSrc = assertInternalAssetPath(raw.imageSrc, `${path}.imageSrc`);
  }

  let facing: IOverworldTilemapObject["facing"];
  let visionRange: number | undefined;
  if (raw.visionRange !== undefined) {
    if (kind !== "DUEL" && kind !== "BOSS") {
      fail(path, `solo DUEL/BOSS admiten visionRange (kind actual: ${kind})`);
    }
    visionRange = assertBoundedInteger(raw.visionRange, `${path}.visionRange`, 1, 16);
    const facingValue = assertNonEmptyString(raw.facing, `${path}.facing`);
    if (!VALID_FACINGS.has(facingValue)) fail(`${path}.facing`, `facing desconocido '${facingValue}'`);
    facing = facingValue as IOverworldTilemapObject["facing"];
  }

  let visionRect: IOverworldTilemapObject["visionRect"];
  if (raw.visionRect !== undefined) {
    if (kind !== "DUEL" && kind !== "BOSS") {
      fail(path, `solo DUEL/BOSS admiten visionRect (kind actual: ${kind})`);
    }
    if (!isRecord(raw.visionRect)) fail(`${path}.visionRect`, "se esperaba un rect {x0,y0,x1,y1}");
    const rx0 = assertBoundedInteger(raw.visionRect.x0, `${path}.visionRect.x0`, 0, width - 1);
    const ry0 = assertBoundedInteger(raw.visionRect.y0, `${path}.visionRect.y0`, 0, height - 1);
    const rx1 = assertBoundedInteger(raw.visionRect.x1, `${path}.visionRect.x1`, 0, width - 1);
    const ry1 = assertBoundedInteger(raw.visionRect.y1, `${path}.visionRect.y1`, 0, height - 1);
    if (rx1 < rx0 || ry1 < ry0) fail(`${path}.visionRect`, "se esperaba x0<=x1 e y0<=y1");
    visionRect = { x0: rx0, y0: ry0, x1: rx1, y1: ry1 };
  }

  let patrolAxis: IOverworldTilemapObject["patrolAxis"];
  let patrolLength: number | undefined;
  if (raw.patrolAxis !== undefined || raw.patrolLength !== undefined) {
    if (kind !== "DUEL" && kind !== "BOSS") {
      fail(path, `solo DUEL/BOSS admiten patrulla (kind actual: ${kind})`);
    }
    const axisValue = assertNonEmptyString(raw.patrolAxis, `${path}.patrolAxis`);
    if (axisValue !== "H" && axisValue !== "V") fail(`${path}.patrolAxis`, "se esperaba 'H' o 'V'");
    patrolAxis = axisValue;
    patrolLength = assertBoundedInteger(raw.patrolLength, `${path}.patrolLength`, 1, 12);
  }

  let patrolSweep: boolean | undefined;
  if (raw.patrolSweep !== undefined) {
    if (typeof raw.patrolSweep !== "boolean") fail(`${path}.patrolSweep`, "se esperaba un booleano");
    if (patrolAxis === undefined) fail(`${path}.patrolSweep`, "patrolSweep requiere patrulla (patrolAxis/patrolLength)");
    patrolSweep = raw.patrolSweep;
  }

  let hidden: boolean | undefined;
  if (raw.hidden !== undefined) {
    if (typeof raw.hidden !== "boolean") fail(`${path}.hidden`, "se esperaba un booleano");
    hidden = raw.hidden;
  }

  // v2 — luces de interruptor: solo SWITCH ilumina la oscuridad al activarse.
  let lightRadius: number | undefined;
  let lightRect: IOverworldTilemapObject["lightRect"];
  if (raw.lightRadius !== undefined || raw.lightRect !== undefined) {
    if (kind !== "SWITCH") {
      fail(path, `solo SWITCH admite luz (lightRadius/lightRect); kind actual: ${kind}`);
    }
    if (raw.lightRadius !== undefined) {
      lightRadius = assertBoundedInteger(raw.lightRadius, `${path}.lightRadius`, 1, 64);
    }
    if (raw.lightRect !== undefined) {
      if (!isRecord(raw.lightRect)) fail(`${path}.lightRect`, "se esperaba un rect {x0,y0,x1,y1}");
      const x0 = assertBoundedInteger(raw.lightRect.x0, `${path}.lightRect.x0`, 0, width - 1);
      const y0 = assertBoundedInteger(raw.lightRect.y0, `${path}.lightRect.y0`, 0, height - 1);
      const x1 = assertBoundedInteger(raw.lightRect.x1, `${path}.lightRect.x1`, 0, width - 1);
      const y1 = assertBoundedInteger(raw.lightRect.y1, `${path}.lightRect.y1`, 0, height - 1);
      if (x1 < x0 || y1 < y0) fail(`${path}.lightRect`, "se esperaba x0<=x1 e y0<=y1");
      lightRect = { x0, y0, x1, y1 };
    }
  }

  return {
    id,
    kind,
    tileX,
    tileY,
    sprite,
    trigger,
    gateRequiredNodeIds,
    warp,
    duelHref,
    imageSrc,
    facing,
    visionRange,
    visionRect,
    patrolAxis,
    patrolLength,
    patrolSweep,
    hidden,
    lightRadius,
    lightRect,
  };
}

function validateSpawn(
  raw: unknown,
  path: string,
  width: number,
  height: number,
  collision: number[][],
): IOverworldTilemapSpawn {
  if (!isRecord(raw)) fail(path, "se esperaba un objeto");
  const id = assertNonEmptyString(raw.id, `${path}.id`);
  const tileX = assertBoundedInteger(raw.tileX, `${path}.tileX`, 0, width - 1);
  const tileY = assertBoundedInteger(raw.tileY, `${path}.tileY`, 0, height - 1);
  const facing = assertNonEmptyString(raw.facing, `${path}.facing`);
  if (!VALID_FACINGS.has(facing)) fail(`${path}.facing`, `facing desconocido '${facing}'`);
  if (!isWalkableCell(collision, tileX, tileY)) {
    fail(path, `el spawn '${id}' debe estar sobre una celda transitable`);
  }
  return { id, tileX, tileY, facing: facing as IOverworldTilemapSpawn["facing"] };
}

function assertUniqueIds(entries: ReadonlyArray<{ id: string }>, path: string): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.id)) fail(path, `id duplicado '${entry.id}'`);
    seen.add(entry.id);
  }
}

function assertUniquePositions(entries: ReadonlyArray<{ id: string; tileX: number; tileY: number }>, path: string): void {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const key = `${entry.tileX},${entry.tileY}`;
    const existing = seen.get(key);
    if (existing) {
      fail(path, `los objetos '${existing}' y '${entry.id}' comparten la celda (${entry.tileX}, ${entry.tileY})`);
    }
    seen.set(key, entry.id);
  }
}

/**
 * Valida un tilemap crudo (JSON de red o disco) y devuelve el contrato tipado.
 * Lanza `ValidationError` con la ruta exacta del problema; nunca deja pasar
 * datos parciales al motor.
 */
export function validateOverworldTilemap(raw: unknown): IOverworldTilemap {
  if (!isRecord(raw)) fail("$", "se esperaba un objeto raíz");
  const schemaVersion = assertBoundedInteger(
    raw.schemaVersion,
    "$.schemaVersion",
    OVERWORLD_TILEMAP_SCHEMA_VERSION,
    OVERWORLD_TILEMAP_SCHEMA_VERSION,
  );
  const id = assertNonEmptyString(raw.id, "$.id");
  const act = assertBoundedInteger(raw.act, "$.act", 1, 99);
  const tileSize = assertBoundedInteger(raw.tileSize, "$.tileSize", MIN_TILE_SIZE, MAX_TILE_SIZE);
  const width = assertBoundedInteger(raw.width, "$.width", 1, MAX_MAP_DIMENSION);
  const height = assertBoundedInteger(raw.height, "$.height", 1, MAX_MAP_DIMENSION);
  const atlasSrc =
    raw.atlasSrc === undefined ? undefined : assertInternalAssetPath(raw.atlasSrc, "$.atlasSrc");

  let ambient: IOverworldTilemap["ambient"];
  if (raw.ambient !== undefined) {
    const ambientValue = assertNonEmptyString(raw.ambient, "$.ambient");
    if (!VALID_AMBIENTS.has(ambientValue)) fail("$.ambient", "se esperaba 'NORMAL' o 'DARK'");
    ambient = ambientValue as IOverworldTilemap["ambient"];
  }

  if (!isRecord(raw.layers)) fail("$.layers", "se esperaban capas ground/overlay");
  const ground = assertLayerMatrix(raw.layers.ground, "$.layers.ground", width, height, 65535);
  const overlay = assertLayerMatrix(raw.layers.overlay, "$.layers.overlay", width, height, 65535);
  const collision = assertLayerMatrix(raw.collision, "$.collision", width, height, 1);

  if (!Array.isArray(raw.objects) || raw.objects.length > MAX_OBJECTS) {
    fail("$.objects", `se esperaba un array de hasta ${MAX_OBJECTS} objetos`);
  }
  const objects = raw.objects.map((entry, index) =>
    validateObject(entry, `$.objects[${index}]`, width, height, collision),
  );
  assertUniqueIds(objects, "$.objects");
  assertUniquePositions(objects, "$.objects");

  if (!Array.isArray(raw.spawns) || raw.spawns.length === 0 || raw.spawns.length > MAX_SPAWNS) {
    fail("$.spawns", `se esperaba un array de 1 a ${MAX_SPAWNS} spawns`);
  }
  const spawns = raw.spawns.map((entry, index) =>
    validateSpawn(entry, `$.spawns[${index}]`, width, height, collision),
  );
  assertUniqueIds(spawns, "$.spawns");

  const defaultSpawnId = assertNonEmptyString(raw.defaultSpawnId, "$.defaultSpawnId");
  if (!spawns.some((spawn) => spawn.id === defaultSpawnId)) {
    fail("$.defaultSpawnId", `no existe ningún spawn con id '${defaultSpawnId}'`);
  }

  return {
    schemaVersion,
    id,
    act,
    ambient,
    tileSize,
    width,
    height,
    atlasSrc,
    layers: { ground, overlay },
    collision,
    objects,
    spawns,
    defaultSpawnId,
  };
}

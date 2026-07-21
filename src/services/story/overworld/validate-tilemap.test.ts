// src/services/story/overworld/validate-tilemap.test.ts - Verifica validación estricta del tilemap JSON del overworld.
import { ValidationError } from "@/core/errors/ValidationError";
import { validateOverworldTilemap } from "@/services/story/overworld/validate-tilemap";
import {
  buildCollisionGridFromTilemap,
  listGatesFromTilemap,
} from "@/services/story/overworld/tilemap-runtime";

function buildValidRawTilemap(): Record<string, unknown> {
  return {
    schemaVersion: 2,
    id: "act-test",
    act: 1,
    tileSize: 32,
    width: 3,
    height: 2,
    atlasSrc: "/assets/story/overworld/act-test-atlas.webp",
    layers: {
      ground: [
        [1, 1, 1],
        [1, 1, 1],
      ],
      overlay: [
        [0, 0, 0],
        [0, 0, 0],
      ],
    },
    collision: [
      [1, 1, 1],
      [1, 0, 1],
    ],
    objects: [
      {
        id: "story-ch1-duel-1",
        kind: "DUEL",
        tileX: 2,
        tileY: 0,
        sprite: "opponent-apprentice",
        trigger: "ADJACENT_ACTION",
        duelHref: "/hub/story/chapter/1/duel/1",
      },
      {
        id: "gate-main-bridge",
        kind: "GATE",
        tileX: 1,
        tileY: 0,
        sprite: "gate-energy",
        trigger: "ADJACENT_ACTION",
        gateRequiredNodeIds: ["story-ch1-duel-1"],
      },
    ],
    spawns: [{ id: "spawn-entry", tileX: 0, tileY: 0, facing: "RIGHT" }],
    defaultSpawnId: "spawn-entry",
  };
}

describe("validateOverworldTilemap", () => {
  it("acepta un tilemap completo y devuelve el contrato tipado", () => {
    const tilemap = validateOverworldTilemap(buildValidRawTilemap());
    expect(tilemap.id).toBe("act-test");
    expect(tilemap.objects).toHaveLength(2);
    expect(tilemap.spawns[0].facing).toBe("RIGHT");
  });

  it("rechaza una versión de schema desconocida", () => {
    const raw = { ...buildValidRawTilemap(), schemaVersion: 99 };
    expect(() => validateOverworldTilemap(raw)).toThrow(ValidationError);
  });

  it("rechaza dimensiones fuera del límite anti-abuso", () => {
    const raw = { ...buildValidRawTilemap(), width: 100000 };
    expect(() => validateOverworldTilemap(raw)).toThrow(/entero entre 1 y 512/);
  });

  it("rechaza atlas con URL externa o path traversal", () => {
    expect(() =>
      validateOverworldTilemap({ ...buildValidRawTilemap(), atlasSrc: "https://evil.example/x.png" }),
    ).toThrow(/rutas internas/);
    expect(() =>
      validateOverworldTilemap({ ...buildValidRawTilemap(), atlasSrc: "/assets/../../secret" }),
    ).toThrow(/rutas internas/);
  });

  it("rechaza matrices con dimensiones incoherentes", () => {
    const raw = buildValidRawTilemap();
    (raw.layers as Record<string, unknown>).ground = [[1, 1, 1]];
    expect(() => validateOverworldTilemap(raw)).toThrow(/2 filas/);
  });

  it("rechaza objetos fuera de límites del mapa", () => {
    const raw = buildValidRawTilemap();
    (raw.objects as Record<string, unknown>[])[0].tileX = 3;
    expect(() => validateOverworldTilemap(raw)).toThrow(/entero entre 0 y 2/);
  });

  it("rechaza ids de objeto duplicados", () => {
    const raw = buildValidRawTilemap();
    const objects = raw.objects as Record<string, unknown>[];
    objects[1] = { ...objects[0], tileX: 0, tileY: 1 };
    expect(() => validateOverworldTilemap(raw)).toThrow(/id duplicado/);
  });

  it("rechaza dos objetos en la misma celda", () => {
    const raw = buildValidRawTilemap();
    const objects = raw.objects as Record<string, unknown>[];
    objects[1] = { ...(objects[1] as object), tileX: 2, tileY: 0 } as Record<string, unknown>;
    expect(() => validateOverworldTilemap(raw)).toThrow(/comparten la celda/);
  });

  it("rechaza una puerta sin requisitos", () => {
    const raw = buildValidRawTilemap();
    (raw.objects as Record<string, unknown>[])[1].gateRequiredNodeIds = [];
    expect(() => validateOverworldTilemap(raw)).toThrow(/al menos un requisito/);
  });

  it("rechaza una puerta sobre celda no transitable", () => {
    const raw = buildValidRawTilemap();
    const objects = raw.objects as Record<string, unknown>[];
    objects[1] = { ...(objects[1] as object), tileX: 1, tileY: 1 } as Record<string, unknown>;
    expect(() => validateOverworldTilemap(raw)).toThrow(/celda transitable/);
  });

  it("rechaza un duelo sin duelHref", () => {
    const raw = buildValidRawTilemap();
    delete (raw.objects as Record<string, unknown>[])[0].duelHref;
    expect(() => validateOverworldTilemap(raw)).toThrow(/necesita duelHref/);
  });

  it("rechaza un WARP sin destino y un warp en kind no-WARP", () => {
    const raw = buildValidRawTilemap();
    const objects = raw.objects as Record<string, unknown>[];
    objects.push({
      id: "warp-act2",
      kind: "WARP",
      tileX: 0,
      tileY: 1,
      sprite: "portal",
      trigger: "STEP_ON",
    });
    expect(() => validateOverworldTilemap(raw)).toThrow(/necesita destino/);

    const rawWithBadWarp = buildValidRawTilemap();
    (rawWithBadWarp.objects as Record<string, unknown>[])[0].warp = {
      toMapId: "act-2",
      toSpawnId: "spawn-entry",
      direction: "forward",
    };
    expect(() => validateOverworldTilemap(rawWithBadWarp)).toThrow(/solo los objetos WARP/);
  });

  it("rechaza defaultSpawnId inexistente y spawn sobre celda bloqueada", () => {
    expect(() =>
      validateOverworldTilemap({ ...buildValidRawTilemap(), defaultSpawnId: "spawn-x" }),
    ).toThrow(/ningún spawn/);
    const raw = buildValidRawTilemap();
    (raw.spawns as Record<string, unknown>[])[0] = { id: "spawn-entry", tileX: 1, tileY: 1, facing: "UP" };
    expect(() => validateOverworldTilemap(raw)).toThrow(/celda transitable/);
  });

  it("rechaza entradas raíz que no son objeto", () => {
    expect(() => validateOverworldTilemap(null)).toThrow(ValidationError);
    expect(() => validateOverworldTilemap([])).toThrow(ValidationError);
    expect(() => validateOverworldTilemap("{}")).toThrow(ValidationError);
  });

  // ── v2: mecánicas interactivas ──────────────────────────────────────────────
  it("acepta ambient DARK y un interruptor con luz", () => {
    const raw = buildValidRawTilemap();
    raw.ambient = "DARK";
    (raw.objects as Record<string, unknown>[]).push({
      id: "story-ch-switch-1",
      kind: "SWITCH",
      tileX: 0,
      tileY: 1,
      sprite: "switch",
      trigger: "ADJACENT_ACTION",
      lightRect: { x0: 0, y0: 0, x1: 2, y1: 1 },
    });
    const tilemap = validateOverworldTilemap(raw);
    expect(tilemap.ambient).toBe("DARK");
    expect(tilemap.objects.at(-1)?.lightRect).toEqual({ x0: 0, y0: 0, x1: 2, y1: 1 });
  });

  it("acepta ambient TERMINAL (verde, Acto 4)", () => {
    const tilemap = validateOverworldTilemap({ ...buildValidRawTilemap(), ambient: "TERMINAL" });
    expect(tilemap.ambient).toBe("TERMINAL");
  });

  it("rechaza ambient desconocido", () => {
    expect(() => validateOverworldTilemap({ ...buildValidRawTilemap(), ambient: "FOGGY" })).toThrow(
      /'NORMAL', 'DARK' o 'TERMINAL'/,
    );
  });

  it("rechaza luz en un kind que no es SWITCH", () => {
    const raw = buildValidRawTilemap();
    (raw.objects as Record<string, unknown>[])[0].lightRadius = 4;
    expect(() => validateOverworldTilemap(raw)).toThrow(/solo SWITCH admite luz/);
  });

  it("rechaza una caja o placa sobre celda no transitable", () => {
    const raw = buildValidRawTilemap();
    (raw.objects as Record<string, unknown>[]).push({
      id: "story-ch-box-1",
      kind: "BOX",
      tileX: 1,
      tileY: 1,
      sprite: "box",
      trigger: "BUMP",
    });
    expect(() => validateOverworldTilemap(raw)).toThrow(/celda transitable/);
  });
});

describe("tilemap-runtime", () => {
  it("convierte colisión compacta a rejilla booleana", () => {
    const tilemap = validateOverworldTilemap(buildValidRawTilemap());
    const grid = buildCollisionGridFromTilemap(tilemap);
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(2);
    expect(grid.walkable[0][1]).toBe(true);
    expect(grid.walkable[1][1]).toBe(false);
  });

  it("extrae solo las puertas con requisitos", () => {
    const tilemap = validateOverworldTilemap(buildValidRawTilemap());
    const gates = listGatesFromTilemap(tilemap);
    expect(gates).toHaveLength(1);
    expect(gates[0]).toEqual({
      id: "gate-main-bridge",
      tileX: 1,
      tileY: 0,
      requiredNodeIds: ["story-ch1-duel-1"],
    });
  });
});

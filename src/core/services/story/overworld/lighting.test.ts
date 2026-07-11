// src/core/services/story/overworld/lighting.test.ts - Reglas puras de iluminación (interruptores + celdas iluminadas).
import {
  ISwitchLightSource,
  isTileLit,
  resolveActiveLights,
} from "@/core/services/story/overworld/lighting";

const SOURCES: ISwitchLightSource[] = [
  { id: "switch-hall", light: { kind: "RECT", x0: 0, y0: 0, x1: 3, y1: 3 } },
  { id: "switch-nook", light: { kind: "RADIAL", tileX: 10, tileY: 10, radius: 2 } },
];

describe("resolveActiveLights", () => {
  it("solo enciende los interruptores accionados (interacted)", () => {
    expect(resolveActiveLights(SOURCES, new Set())).toHaveLength(0);
    const lit = resolveActiveLights(SOURCES, new Set(["switch-hall"]));
    expect(lit).toHaveLength(1);
    expect(lit[0]).toEqual({ kind: "RECT", x0: 0, y0: 0, x1: 3, y1: 3 });
  });

  it("acumula varias fuentes activas", () => {
    expect(resolveActiveLights(SOURCES, new Set(["switch-hall", "switch-nook"]))).toHaveLength(2);
  });
});

describe("isTileLit", () => {
  const lights = resolveActiveLights(SOURCES, new Set(["switch-hall", "switch-nook"]));

  it("detecta celdas dentro de un rect", () => {
    expect(isTileLit({ tileX: 2, tileY: 3 }, lights)).toBe(true);
    expect(isTileLit({ tileX: 4, tileY: 0 }, lights)).toBe(false);
  });

  it("detecta celdas dentro de un radio", () => {
    expect(isTileLit({ tileX: 11, tileY: 10 }, lights)).toBe(true); // dist 1 <= 2
    expect(isTileLit({ tileX: 13, tileY: 10 }, lights)).toBe(false); // dist 3 > 2
  });

  it("una celda oscura no está iluminada por ninguna fuente", () => {
    expect(isTileLit({ tileX: 20, tileY: 20 }, lights)).toBe(false);
  });
});

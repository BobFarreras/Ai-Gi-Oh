// src/core/services/story/overworld/sightline.test.ts - Verifica la detección de reto por línea de visión de oponentes.
import {
  ISightlineSource,
  resolveSightlineDistance,
  resolveTriggeredSightline,
} from "@/core/services/story/overworld/sightline";

const alwaysTransparent = () => true;
const alwaysActive = () => true;

const guard: ISightlineSource = { id: "duel-1", tileX: 5, tileY: 5, facing: "RIGHT", visionRange: 3 };

describe("resolveSightlineDistance", () => {
  it("ve al jugador dentro del rango en línea recta", () => {
    expect(resolveSightlineDistance(guard, { tileX: 7, tileY: 5 }, alwaysTransparent)).toBe(2);
    expect(resolveSightlineDistance(guard, { tileX: 8, tileY: 5 }, alwaysTransparent)).toBe(3);
  });

  it("no ve más allá del rango", () => {
    expect(resolveSightlineDistance(guard, { tileX: 9, tileY: 5 }, alwaysTransparent)).toBeNull();
  });

  it("no ve al jugador fuera de la línea (otra fila)", () => {
    expect(resolveSightlineDistance(guard, { tileX: 7, tileY: 6 }, alwaysTransparent)).toBeNull();
  });

  it("no ve al jugador que está de espaldas", () => {
    expect(resolveSightlineDistance(guard, { tileX: 3, tileY: 5 }, alwaysTransparent)).toBeNull();
  });

  it("un muro entre medias corta la visión", () => {
    // Muro en (7,5): el jugador en (8,5) queda tapado.
    const isTransparent = (x: number, y: number) => !(x === 7 && y === 5);
    expect(resolveSightlineDistance(guard, { tileX: 8, tileY: 5 }, isTransparent)).toBeNull();
    // Pero al jugador delante del muro sí lo ve.
    expect(resolveSightlineDistance(guard, { tileX: 6, tileY: 5 }, isTransparent)).toBe(1);
  });

  it("respeta cada dirección cardinal", () => {
    const up: ISightlineSource = { ...guard, facing: "UP" };
    expect(resolveSightlineDistance(up, { tileX: 5, tileY: 3 }, alwaysTransparent)).toBe(2);
    const down: ISightlineSource = { ...guard, facing: "DOWN" };
    expect(resolveSightlineDistance(down, { tileX: 5, tileY: 7 }, alwaysTransparent)).toBe(2);
  });
});

describe("resolveTriggeredSightline", () => {
  it("devuelve el oponente que ve al jugador", () => {
    const triggered = resolveTriggeredSightline({
      playerTile: { tileX: 7, tileY: 5 },
      sources: [guard],
      isTransparent: alwaysTransparent,
      isSourceActive: alwaysActive,
    });
    expect(triggered?.id).toBe("duel-1");
  });

  it("elige el oponente más cercano si varios ven al jugador", () => {
    const near: ISightlineSource = { id: "near", tileX: 8, tileY: 5, facing: "LEFT", visionRange: 3 };
    const far: ISightlineSource = { id: "far", tileX: 3, tileY: 5, facing: "RIGHT", visionRange: 5 };
    const triggered = resolveTriggeredSightline({
      playerTile: { tileX: 6, tileY: 5 },
      sources: [far, near],
      isTransparent: alwaysTransparent,
      isSourceActive: alwaysActive,
    });
    expect(triggered?.id).toBe("near");
  });

  it("ignora oponentes ya derrotados", () => {
    const triggered = resolveTriggeredSightline({
      playerTile: { tileX: 7, tileY: 5 },
      sources: [guard],
      isTransparent: alwaysTransparent,
      isSourceActive: () => false,
    });
    expect(triggered).toBeNull();
  });

  it("devuelve null si nadie ve al jugador", () => {
    const triggered = resolveTriggeredSightline({
      playerTile: { tileX: 0, tileY: 0 },
      sources: [guard],
      isTransparent: alwaysTransparent,
      isSourceActive: alwaysActive,
    });
    expect(triggered).toBeNull();
  });
});

// src/components/hub/academy/training/combat-modes/scene/internal/combat-modes-scene-config.test.ts - Verifica layout responsive, rutas y rotación del carrusel.
import { describe, expect, it } from "vitest";
import {
  COMBAT_MODE_SCENE_NODES,
  MOBILE_CAROUSEL_SLOTS,
  resolveCarouselPosition,
  resolveCombatModesLayout,
} from "./combat-modes-scene-config";

describe("COMBAT_MODE_SCENE_NODES", () => {
  it("cubre los tres modos con su ruta jugable", () => {
    expect(COMBAT_MODE_SCENE_NODES.map((node) => node.key)).toEqual(["arena", "survival", "olympus"]);
    expect(COMBAT_MODE_SCENE_NODES.map((node) => node.route)).toEqual([
      "/hub/academy/training/arena/classic",
      "/hub/academy/training/arena/survival",
      "/hub/academy/training/arena/olympus",
    ]);
  });

  it("da a cada modo un color distinto: la identidad cromática es lo que los separa de un vistazo", () => {
    const colors = COMBAT_MODE_SCENE_NODES.map((node) => node.accentColor);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("escalona la aparición para que los hologramas no entren todos a la vez", () => {
    const delays = COMBAT_MODE_SCENE_NODES.map((node) => node.activationDelaySeconds);
    expect(delays).toEqual([...delays].sort((left, right) => left - right));
    expect(new Set(delays).size).toBe(delays.length);
  });
});

describe("resolveCombatModesLayout", () => {
  it("apaga la escenografía en móvil para que el carrusel vaya fluido", () => {
    expect(resolveCombatModesLayout(390).showScenery).toBe(false);
    expect(resolveCombatModesLayout(768).showScenery).toBe(true);
    expect(resolveCombatModesLayout(1440).showScenery).toBe(true);
  });

  it("achica los pilares en pantallas pequeñas para que quepan los tres", () => {
    expect(resolveCombatModesLayout(390).pillarScale).toBeLessThan(resolveCombatModesLayout(768).pillarScale);
    expect(resolveCombatModesLayout(768).pillarScale).toBeLessThan(resolveCombatModesLayout(1440).pillarScale);
  });

  it("coloca los tres módulos en pantallas anchas sin solaparse", () => {
    const positions = resolveCombatModesLayout(1440).positions;
    expect(positions).toHaveLength(3);
    const xs = positions.map(([x]) => x);
    expect(new Set(xs).size).toBe(3);
  });
});

describe("resolveCarouselPosition", () => {
  it("pone delante el módulo activo, sea cual sea", () => {
    expect(resolveCarouselPosition(0, 0, 3)).toEqual(MOBILE_CAROUSEL_SLOTS[0]);
    expect(resolveCarouselPosition(2, 2, 3)).toEqual(MOBILE_CAROUSEL_SLOTS[0]);
  });

  it("reparte el resto por los slots siguientes en orden circular", () => {
    // Con el módulo 1 al frente, el 2 queda en medio y el 0 detrás.
    expect(resolveCarouselPosition(2, 1, 3)).toEqual(MOBILE_CAROUSEL_SLOTS[1]);
    expect(resolveCarouselPosition(0, 1, 3)).toEqual(MOBILE_CAROUSEL_SLOTS[2]);
  });

  it("no se rompe con índices negativos al retroceder en el carrusel", () => {
    expect(resolveCarouselPosition(0, 2, 3)).toEqual(MOBILE_CAROUSEL_SLOTS[1]);
  });
});

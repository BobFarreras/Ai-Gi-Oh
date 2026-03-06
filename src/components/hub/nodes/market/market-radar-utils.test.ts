// src/components/hub/nodes/market/market-radar-utils.test.ts - Verifica generación válida de ecos para el radar del mercado.
import { describe, expect, it } from "vitest";
import { generateRandomMarketBlips } from "./market-radar-utils";

describe("market-radar-utils", () => {
  it("genera la cantidad solicitada de blips", () => {
    const blips = generateRandomMarketBlips(4);
    expect(blips).toHaveLength(4);
  });

  it("asigna valores dentro del rango esperado", () => {
    const [first] = generateRandomMarketBlips(1);
    expect(first.angle).toBeGreaterThanOrEqual(0);
    expect(first.angle).toBeLessThanOrEqual(360);
    expect(first.distance).toBeGreaterThanOrEqual(10);
    expect(first.distance).toBeLessThanOrEqual(45);
  });
});

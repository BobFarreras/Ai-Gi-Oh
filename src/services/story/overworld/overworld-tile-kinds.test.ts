// src/services/story/overworld/overworld-tile-kinds.test.ts - Mapeo de tiles de cinta a su dirección de arrastre.
import { GROUND_TILE, resolveBeltDirection } from "@/services/story/overworld/overworld-tile-kinds";

describe("resolveBeltDirection", () => {
  it("mapea cada tile de cinta a su dirección", () => {
    expect(resolveBeltDirection(GROUND_TILE.BELT_UP)).toBe("UP");
    expect(resolveBeltDirection(GROUND_TILE.BELT_DOWN)).toBe("DOWN");
    expect(resolveBeltDirection(GROUND_TILE.BELT_LEFT)).toBe("LEFT");
    expect(resolveBeltDirection(GROUND_TILE.BELT_RIGHT)).toBe("RIGHT");
  });

  it("devuelve null para suelos que no son cinta", () => {
    expect(resolveBeltDirection(GROUND_TILE.SAND)).toBeNull();
    expect(resolveBeltDirection(GROUND_TILE.PATH)).toBeNull();
    expect(resolveBeltDirection(0)).toBeNull();
    expect(resolveBeltDirection(undefined)).toBeNull();
  });
});

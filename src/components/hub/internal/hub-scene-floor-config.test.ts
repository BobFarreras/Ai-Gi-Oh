// src/components/hub/internal/hub-scene-floor-config.test.ts - Verifica el contrato visual del suelo 3D del Hub.
import { describe, expect, it } from "vitest";
import { HUB_SCENE_FLOOR_CONFIG } from "./hub-scene-floor-config";

describe("hub-scene-floor-config", () => {
  it("define un suelo más contenido para evitar exceso de superficie", () => {
    expect(HUB_SCENE_FLOOR_CONFIG.planeSize).toBeLessThan(150);
    expect(HUB_SCENE_FLOOR_CONFIG.gridSize).toBeLessThan(150);
  });

  it("define una rejilla menos agresiva y con reflexión moderada", () => {
    expect(HUB_SCENE_FLOOR_CONFIG.reflectionStrength).toBeLessThan(40);
    expect(HUB_SCENE_FLOOR_CONFIG.reflectionResolution).toBeLessThanOrEqual(1024);
  });
});

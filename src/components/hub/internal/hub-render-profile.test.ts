// src/components/hub/internal/hub-render-profile.test.ts - Verifica perfil de render adaptativo para hub 3D por tamaño de pantalla.
import { describe, expect, it } from "vitest";
import { HUB_SCENE_FLOOR_CONFIG } from "@/components/hub/internal/hub-scene-floor-config";
import { resolveFloorConfigForProfile, resolveHubRenderProfile } from "./hub-render-profile";

describe("hub-render-profile", () => {
  it("reduce coste en móvil", () => {
    const profile = resolveHubRenderProfile(390);
    expect(profile.dpr[1]).toBe(1.2);
    expect(profile.floorReflectionResolution).toBe(256);
  });

  it("mantiene calidad alta en desktop", () => {
    const profile = resolveHubRenderProfile(1440);
    const floor = resolveFloorConfigForProfile(HUB_SCENE_FLOOR_CONFIG, profile);
    expect(profile.dpr[1]).toBe(1.5);
    expect(floor.gridDivisions).toBe(90);
  });
});

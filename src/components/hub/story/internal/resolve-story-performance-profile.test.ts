// src/components/hub/story/internal/resolve-story-performance-profile.test.ts - Verifica umbrales de perfil de rendimiento Story por viewport.
import { describe, expect, it } from "vitest";
import { resolveStoryPerformanceProfile } from "@/components/hub/story/internal/resolve-story-performance-profile";

describe("resolveStoryPerformanceProfile", () => {
  it("marca low power en móvil estrecho", () => {
    const profile = resolveStoryPerformanceProfile(390);
    expect(profile.isMobileViewport).toBe(true);
    expect(profile.isLowPowerMode).toBe(true);
    expect(profile.shouldReduceMapEffects).toBe(true);
  });

  it("mantiene efectos en desktop", () => {
    const profile = resolveStoryPerformanceProfile(1280);
    expect(profile.isMobileViewport).toBe(false);
    expect(profile.isLowPowerMode).toBe(false);
    expect(profile.shouldReduceMapEffects).toBe(false);
  });
});

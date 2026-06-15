// src/components/game/board/internal/resolve-board-performance-profile.test.ts - Verifica la decisión de degradar efectos de combate según señales del dispositivo.
import { describe, expect, it } from "vitest";
import { IBoardPerformanceSignals, resolveBoardPerformanceProfile } from "./resolve-board-performance-profile";

/** Señales base de un desktop potente sin override. */
function createCapableDesktopSignals(overrides: Partial<IBoardPerformanceSignals> = {}): IBoardPerformanceSignals {
  return {
    isMobileViewport: false,
    prefersReducedMotion: false,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    isSlowCpu: false,
    effectsOverride: null,
    ...overrides,
  };
}

describe("resolveBoardPerformanceProfile", () => {
  it("mantiene efectos completos en desktop potente", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals());
    expect(profile.shouldReduceCombatEffects).toBe(false);
    expect(profile.isMobileViewport).toBe(false);
  });

  it("reduce efectos en viewport móvil", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ isMobileViewport: true }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
    expect(profile.isMobileViewport).toBe(true);
  });

  it("reduce efectos con pocos núcleos de CPU", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ hardwareConcurrency: 4 }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
  });

  it("reduce efectos con poca memoria", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ deviceMemory: 4 }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
  });

  it("reduce efectos cuando el benchmark detecta CPU lenta (PC antiguo)", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ isSlowCpu: true }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
  });

  it("reduce efectos con prefers-reduced-motion", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ prefersReducedMotion: true }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
  });

  it("el override 'reduced' fuerza degradación en desktop potente", () => {
    const profile = resolveBoardPerformanceProfile(createCapableDesktopSignals({ effectsOverride: "reduced" }));
    expect(profile.shouldReduceCombatEffects).toBe(true);
  });

  it("el override 'full' mantiene efectos aunque el dispositivo sea limitado", () => {
    const profile = resolveBoardPerformanceProfile(
      createCapableDesktopSignals({ effectsOverride: "full", isMobileViewport: true, isSlowCpu: true, deviceMemory: 2 }),
    );
    expect(profile.shouldReduceCombatEffects).toBe(false);
  });
});

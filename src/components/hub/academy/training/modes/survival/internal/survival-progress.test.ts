// src/components/hub/academy/training/modes/survival/internal/survival-progress.test.ts - Verifica la lectura visual del avance de la expedición.
import { describe, expect, it } from "vitest";
import { resolveSurvivalProgress } from "./survival-progress";

const base = { currentLp: 6000, maxLp: 8000, wins: 3, milestoneInterval: 5, milestoneHeal: 2000 };

describe("resolveSurvivalProgress", () => {
  it("traduce los LP vivos a fracción de barra", () => {
    expect(resolveSurvivalProgress(base).lpRatio).toBeCloseTo(0.75);
  });

  it("cuenta las victorias dentro del ciclo de hito y las que faltan", () => {
    expect(resolveSurvivalProgress(base)).toMatchObject({ winsIntoMilestone: 3, winsToMilestone: 2 });
    // Justo tras curar, el ciclo vuelve a empezar entero.
    expect(resolveSurvivalProgress({ ...base, wins: 5 })).toMatchObject({ winsIntoMilestone: 0, winsToMilestone: 5 });
  });

  it("nunca promete más LP de los que la curación puede dar", () => {
    // 7500 + 2000 pasaría de 8000: el tope es el mismo que aplica la RPC.
    expect(resolveSurvivalProgress({ ...base, currentLp: 7500 }).healedLpPreview).toBe(8000);
    expect(resolveSurvivalProgress({ ...base, currentLp: 7500 }).healPreviewRatio).toBeCloseTo(0.0625);
  });

  it("marca alarma solo por debajo de un cuarto de vida", () => {
    expect(resolveSurvivalProgress({ ...base, currentLp: 2001 }).isCritical).toBe(false);
    expect(resolveSurvivalProgress({ ...base, currentLp: 2000 }).isCritical).toBe(true);
  });

  it("no divide por cero cuando el ruleset no cura", () => {
    const readout = resolveSurvivalProgress({ ...base, milestoneInterval: 0, milestoneHeal: 0 });
    expect(readout).toMatchObject({ winsIntoMilestone: 0, winsToMilestone: 0, healPreviewRatio: 0 });
  });

  it("acota LP fuera de rango en vez de pintar una barra imposible", () => {
    expect(resolveSurvivalProgress({ ...base, currentLp: -50 }).lpRatio).toBe(0);
    expect(resolveSurvivalProgress({ ...base, currentLp: 99999 }).lpRatio).toBe(1);
  });
});

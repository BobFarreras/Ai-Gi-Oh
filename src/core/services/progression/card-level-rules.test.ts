// src/core/services/progression/card-level-rules.test.ts - Pruebas de reglas de XP por nivel para barra de progreso de carta.
import { describe, expect, it } from "vitest";
import {
  getCardLevelProgressMetrics,
  getTotalXpRequiredToReachLevel,
  getXpRequiredForNextLevel,
} from "./card-level-rules";

describe("card-level-rules", () => {
  it("calcula escalado incremental de XP por nivel", () => {
    expect(getXpRequiredForNextLevel(0)).toBe(1000);
    expect(getXpRequiredForNextLevel(1)).toBe(1500);
    expect(getXpRequiredForNextLevel(2)).toBe(2000);
  });

  it("calcula el XP acumulado requerido para llegar a un nivel", () => {
    expect(getTotalXpRequiredToReachLevel(0)).toBe(0);
    expect(getTotalXpRequiredToReachLevel(1)).toBe(1000);
    expect(getTotalXpRequiredToReachLevel(2)).toBe(2500);
  });

  it("devuelve métricas de progreso normalizadas para la barra", () => {
    const metrics = getCardLevelProgressMetrics(1, 1750);
    expect(metrics.xpRequiredForNextLevel).toBe(1500);
    expect(metrics.xpIntoCurrentLevel).toBe(750);
    expect(metrics.progressRatio).toBeCloseTo(0.5, 5);
  });
});

// src/core/services/progression/card-level-rules.test.ts - Pruebas de reglas de XP por nivel para barra de progreso de carta.
import { describe, expect, it } from "vitest";
import {
  clampCardTotalXp,
  getCardLevelProgressMetrics,
  getMaxTotalXpForCardLeveling,
  getTotalXpRequiredToReachLevel,
  getXpRequiredForNextLevel,
  resolveCardLevelFromTotalXp,
} from "./card-level-rules";

describe("card-level-rules", () => {
  it("calcula escalado incremental de XP por nivel", () => {
    expect(getXpRequiredForNextLevel(0)).toBe(40);
    expect(getXpRequiredForNextLevel(1)).toBe(60);
    expect(getXpRequiredForNextLevel(2)).toBe(80);
    expect(getXpRequiredForNextLevel(5)).toBe(145);
    expect(getXpRequiredForNextLevel(10)).toBe(290);
    expect(getXpRequiredForNextLevel(20)).toBe(760);
  });

  it("calcula el XP acumulado requerido para llegar a un nivel", () => {
    expect(getTotalXpRequiredToReachLevel(0)).toBe(0);
    expect(getTotalXpRequiredToReachLevel(1)).toBe(40);
    expect(getTotalXpRequiredToReachLevel(2)).toBe(100);
    expect(getTotalXpRequiredToReachLevel(5)).toBe(400);
  });

  it("devuelve métricas de progreso normalizadas para la barra", () => {
    const metrics = getCardLevelProgressMetrics(1, 70);
    expect(metrics.xpRequiredForNextLevel).toBe(60);
    expect(metrics.xpIntoCurrentLevel).toBe(30);
    expect(metrics.progressRatio).toBeCloseTo(0.5, 5);
  });

  it("resuelve nivel por XP total acumulada", () => {
    expect(resolveCardLevelFromTotalXp(0)).toBe(0);
    expect(resolveCardLevelFromTotalXp(40)).toBe(1);
    expect(resolveCardLevelFromTotalXp(99)).toBe(1);
    expect(resolveCardLevelFromTotalXp(100)).toBe(2);
  });

  it("capa XP al máximo de progresión", () => {
    const maxXp = getMaxTotalXpForCardLeveling();
    expect(clampCardTotalXp(maxXp + 999999)).toBe(maxXp);
    expect(resolveCardLevelFromTotalXp(maxXp + 1)).toBe(30);
  });
});

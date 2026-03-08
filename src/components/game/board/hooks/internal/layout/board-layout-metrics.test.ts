// src/components/game/board/hooks/internal/layout/board-layout-metrics.test.ts - Valida reglas de escalado responsive para desktop pequeño y pantallas grandes.
import { describe, expect, it } from "vitest";
import { resolveBoardViewportMetrics } from "./board-layout-metrics";

describe("resolveBoardViewportMetrics", () => {
  it("mantiene escala completa en desktop grande", () => {
    const metrics = resolveBoardViewportMetrics({ width: 1920, height: 1080, hasLeftPanel: false, hasRightPanel: false });
    expect(metrics.boardScale).toBeGreaterThanOrEqual(0.98);
    expect(metrics.boardScale).toBeLessThanOrEqual(1);
    expect(metrics.handCardScale).toBeGreaterThanOrEqual(0.8);
  });

  it("reduce escala en desktop pequeño y compacta la mano", () => {
    const metrics = resolveBoardViewportMetrics({ width: 1240, height: 760, hasLeftPanel: true, hasRightPanel: true });
    expect(metrics.boardScale).toBeLessThan(1);
    expect(metrics.handCardScale).toBeLessThan(0.82);
    expect(metrics.handOverlapPx).toBeGreaterThan(22);
  });
});

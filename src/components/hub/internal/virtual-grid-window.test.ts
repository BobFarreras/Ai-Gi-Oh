// src/components/hub/internal/virtual-grid-window.test.ts - Verifica cálculo de ventana virtual para listas de grid en Home/Market.
import { describe, expect, it } from "vitest";
import { computeVirtualGridWindow } from "@/components/hub/internal/virtual-grid-window";

describe("computeVirtualGridWindow", () => {
  it("calcula columnas y rango visible en estado inicial", () => {
    const result = computeVirtualGridWindow({
      itemCount: 120,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 0,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
      overscanRows: 1,
    });
    expect(result.columns).toBe(4);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBeGreaterThan(0);
    expect(result.totalHeight).toBeGreaterThan(0);
  });

  it("desplaza correctamente el rango al hacer scroll", () => {
    const result = computeVirtualGridWindow({
      itemCount: 120,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 700,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
      overscanRows: 1,
    });
    expect(result.startIndex).toBeGreaterThan(0);
    expect(result.offsetTop).toBeGreaterThan(0);
    expect(result.endIndex).toBeLessThanOrEqual(120);
  });
});

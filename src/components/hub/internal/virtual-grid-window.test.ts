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

  it("no produce resultados negativos con scroll cercano a cero", () => {
    const result = computeVirtualGridWindow({
      itemCount: 50,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 1,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
      overscanRows: 0,
    });
    expect(result.startIndex).toBeGreaterThanOrEqual(0);
    expect(result.offsetTop).toBeGreaterThanOrEqual(0);
  });

  it("maneja itemCount cero sin errores", () => {
    const result = computeVirtualGridWindow({
      itemCount: 0,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 0,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
    });
    expect(result.columns).toBeGreaterThanOrEqual(1);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
    expect(result.totalHeight).toBe(0);
  });

  it("overscanRows amplía el rango visible sin exceder itemCount", () => {
    const noOverscan = computeVirtualGridWindow({
      itemCount: 200,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 300,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
      overscanRows: 0,
    });
    const withOverscan = computeVirtualGridWindow({
      itemCount: 200,
      containerWidth: 400,
      containerHeight: 320,
      scrollTop: 300,
      itemMinWidth: 84,
      itemHeight: 145,
      gap: 12,
      overscanRows: 3,
    });
    expect(withOverscan.startIndex).toBeLessThan(noOverscan.startIndex);
    expect(withOverscan.endIndex).toBeGreaterThan(noOverscan.endIndex);
    expect(withOverscan.endIndex).toBeLessThanOrEqual(200);
  });
});

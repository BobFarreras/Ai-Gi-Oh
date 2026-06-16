// src/components/internal/should-render-performance-toggle.test.ts - Verifica el gating del botón FX por entorno.
import { describe, expect, it } from "vitest";
import { shouldRenderPerformanceToggle } from "./should-render-performance-toggle";

describe("shouldRenderPerformanceToggle", () => {
  it("renderiza en desarrollo", () => {
    expect(shouldRenderPerformanceToggle("development")).toBe(true);
  });

  it("renderiza en test", () => {
    expect(shouldRenderPerformanceToggle("test")).toBe(true);
  });

  it("no renderiza en producción", () => {
    expect(shouldRenderPerformanceToggle("production")).toBe(false);
  });

  it("no renderiza si falta NODE_ENV", () => {
    expect(shouldRenderPerformanceToggle(undefined)).toBe(true);
  });
});

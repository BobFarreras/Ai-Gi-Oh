// src/components/hub/internal/hub-3d-node-math.test.ts - Pruebas de mapeo de posición y color para nodos 3D del hub.
import { describe, expect, it } from "vitest";
import { resolveHubNodeBaseColor, resolveHubNodeWorldPosition } from "./hub-3d-node-math";

describe("hub-3d-node-math", () => {
  it("convierte coordenadas de mapa a plano 3D", () => {
    const result = resolveHubNodeWorldPosition(50, 50);
    expect(result).toEqual({ x: 0, z: 0 });
  });

  it("resuelve color base por tipo de sección", () => {
    expect(resolveHubNodeBaseColor("MARKET")).toBe("#f59e0b");
    expect(resolveHubNodeBaseColor("HOME")).toBe("#10b981");
    expect(resolveHubNodeBaseColor("STORY")).toBe("#0ea5e9");
  });
});

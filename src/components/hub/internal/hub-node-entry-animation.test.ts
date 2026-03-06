// src/components/hub/internal/hub-node-entry-animation.test.ts - Verifica progresión de escala para aparición escalonada de nodos 3D.
import { describe, expect, it } from "vitest";
import { resolveHubNodeEntryScale } from "./hub-node-entry-animation";

describe("hub-node-entry-animation", () => {
  it("permanece en 0 antes del delay", () => {
    expect(resolveHubNodeEntryScale(0.2, 0.4)).toBe(0);
  });

  it("alcanza escala 1 al completar duración", () => {
    expect(resolveHubNodeEntryScale(1, 0.2, 0.5)).toBe(1);
  });
});

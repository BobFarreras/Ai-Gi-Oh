// src/core/services/tutorial/resolve-tutorial-map-state.test.ts - Verifica estado abierto del mapa tutorial con progreso persistido.
import { describe, expect, it } from "vitest";
import { resolveTutorialMapState } from "@/core/services/tutorial/resolve-tutorial-map-state";
import { resolveTutorialNodeCatalog } from "@/core/services/tutorial/resolve-tutorial-node-catalog";

describe("resolveTutorialMapState", () => {
  it("deja todos los nodos disponibles cuando no hay progreso", () => {
    const runtime = resolveTutorialMapState({
      catalog: resolveTutorialNodeCatalog(),
      completedNodeIds: [],
    });
    expect(runtime.every((node) => node.state === "AVAILABLE")).toBe(true);
  });

  it("marca completado y mantiene disponible el resto", () => {
    const runtime = resolveTutorialMapState({
      catalog: resolveTutorialNodeCatalog(),
      completedNodeIds: ["tutorial-arsenal-basics"],
    });
    expect(runtime[0]?.state).toBe("COMPLETED");
    expect(runtime[1]?.state).toBe("AVAILABLE");
  });
});

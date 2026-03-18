// src/core/services/tutorial/resolve-tutorial-map-state.test.ts - Verifica desbloqueo secuencial del mapa tutorial con progreso por nodo.
import { describe, expect, it } from "vitest";
import { resolveTutorialMapState } from "@/core/services/tutorial/resolve-tutorial-map-state";
import { resolveTutorialNodeCatalog } from "@/core/services/tutorial/resolve-tutorial-node-catalog";

describe("resolveTutorialMapState", () => {
  it("deja solo el primer nodo disponible cuando no hay progreso", () => {
    const runtime = resolveTutorialMapState({
      catalog: resolveTutorialNodeCatalog(),
      completedNodeIds: [],
    });
    expect(runtime[0]?.state).toBe("AVAILABLE");
    expect(runtime.slice(1).every((node) => node.state === "LOCKED")).toBe(true);
  });

  it("marca completado y desbloquea el siguiente cuando hay progreso parcial", () => {
    const runtime = resolveTutorialMapState({
      catalog: resolveTutorialNodeCatalog(),
      completedNodeIds: ["tutorial-arsenal-basics"],
    });
    expect(runtime[0]?.state).toBe("COMPLETED");
    expect(runtime[1]?.id).toBe("tutorial-market-basics");
    expect(runtime[1]?.state).toBe("AVAILABLE");
  });
});

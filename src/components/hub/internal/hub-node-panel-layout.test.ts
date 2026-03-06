// src/components/hub/internal/hub-node-panel-layout.test.ts - Verifica que el panel HTML de nodo se coloca por debajo del núcleo 3D.
import { describe, expect, it } from "vitest";
import { HUB_NODE_PANEL_Y_OFFSET } from "./hub-node-panel-layout";

describe("hub-node-panel-layout", () => {
  it("ubica el panel lo bastante abajo para no tapar el núcleo", () => {
    expect(HUB_NODE_PANEL_Y_OFFSET).toBeLessThan(-1.8);
  });
});

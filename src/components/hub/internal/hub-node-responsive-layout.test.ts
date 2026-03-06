// src/components/hub/internal/hub-node-responsive-layout.test.ts - Verifica reescalado de nodos por tamaño de pantalla sin salir de límites.
import { describe, expect, it } from "vitest";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { applyResponsiveNodeLayout } from "./hub-node-responsive-layout";

const BASE_NODES: IHubMapNode[] = [
  { id: "left", sectionType: "MARKET", districtLabel: "A", positionX: 20, positionY: 55 },
  { id: "right", sectionType: "HOME", districtLabel: "B", positionX: 80, positionY: 45 },
];

describe("applyResponsiveNodeLayout", () => {
  it("comprime la separación en móvil", () => {
    const nodes = applyResponsiveNodeLayout(BASE_NODES, 390);
    expect(nodes[0].positionX).toBeGreaterThan(20);
    expect(nodes[1].positionX).toBeLessThan(80);
  });

  it("expande ligeramente la separación en pantallas grandes", () => {
    const nodes = applyResponsiveNodeLayout(BASE_NODES, 1600);
    expect(nodes[0].positionX).toBeLessThan(20);
    expect(nodes[1].positionX).toBeGreaterThan(80);
  });
});

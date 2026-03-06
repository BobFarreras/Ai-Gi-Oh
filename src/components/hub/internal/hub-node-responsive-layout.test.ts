// src/components/hub/internal/hub-node-responsive-layout.test.ts - Verifica reescalado de nodos por tamaño de pantalla sin salir de límites.
import { describe, expect, it } from "vitest";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { applyResponsiveNodeLayout } from "./hub-node-responsive-layout";

const BASE_NODES: IHubMapNode[] = [
  { id: "left", sectionType: "MARKET", districtLabel: "A", positionX: 20, positionY: 55 },
  { id: "right", sectionType: "HOME", districtLabel: "B", positionX: 80, positionY: 45 },
];

const MOBILE_SHAPE_NODES: IHubMapNode[] = [
  { id: "story", sectionType: "STORY", districtLabel: "S", positionX: 20, positionY: 20 },
  { id: "market", sectionType: "MARKET", districtLabel: "M", positionX: 80, positionY: 20 },
  { id: "home", sectionType: "HOME", districtLabel: "H", positionX: 50, positionY: 50 },
  { id: "multi", sectionType: "MULTIPLAYER", districtLabel: "P", positionX: 20, positionY: 80 },
  { id: "training", sectionType: "TRAINING", districtLabel: "T", positionX: 80, positionY: 80 },
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

  it("usa preset 2-1-2 en móvil para máxima visibilidad", () => {
    const nodes = applyResponsiveNodeLayout(MOBILE_SHAPE_NODES, 390);
    const home = nodes.find((node) => node.sectionType === "HOME");
    const story = nodes.find((node) => node.sectionType === "STORY");
    const market = nodes.find((node) => node.sectionType === "MARKET");
    const multiplayer = nodes.find((node) => node.sectionType === "MULTIPLAYER");
    const training = nodes.find((node) => node.sectionType === "TRAINING");
    expect(home?.positionX).toBe(50);
    expect(story?.positionY).toBeLessThan(home?.positionY ?? 0);
    expect(market?.positionY).toBeLessThan(home?.positionY ?? 0);
    expect(multiplayer?.positionY).toBeGreaterThan(home?.positionY ?? 0);
    expect(training?.positionY).toBeGreaterThan(home?.positionY ?? 0);
  });
});

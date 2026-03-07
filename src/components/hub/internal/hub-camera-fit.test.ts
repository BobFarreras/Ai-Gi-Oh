// src/components/hub/internal/hub-camera-fit.test.ts - Verifica encuadre general y foco de cámara por nodo en el Hub.
import { describe, expect, it } from "vitest";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { resolveHubCameraPose, resolveHubNodeFocusPose } from "@/components/hub/internal/hub-camera-fit";

const SAMPLE_NODES: IHubMapNode[] = [
  { id: "market", sectionType: "MARKET", districtLabel: "Mercado", positionX: 24, positionY: 42 },
  { id: "home", sectionType: "HOME", districtLabel: "Arsenal", positionX: 73, positionY: 58 },
];

describe("hub-camera-fit", () => {
  it("devuelve pose por defecto cuando no hay nodos", () => {
    expect(resolveHubCameraPose([], 1280)).toEqual({
      position: [0, 15, 22],
      target: [0, 0, 0],
    });
  });

  it("genera foco de cámara centrado en el nodo objetivo", () => {
    const pose = resolveHubNodeFocusPose(SAMPLE_NODES[0], 1280);
    expect(pose.position[0]).toBeCloseTo((24 - 50) * 0.4, 5);
    expect(pose.target[0]).toBeCloseTo((24 - 50) * 0.4, 5);
    expect(pose.position[2]).toBeGreaterThan(pose.target[2]);
  });
});

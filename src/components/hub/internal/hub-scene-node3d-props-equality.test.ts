// src/components/hub/internal/hub-scene-node3d-props-equality.test.ts - Verifica el comparador de igualdad de nodos 3D del hub.
import { describe, expect, it, vi } from "vitest";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { areHubSceneNode3DPropsEqual, IHubSceneNode3DComparableProps } from "./hub-scene-node3d-props-equality";

function createNode(overrides?: Partial<IHubMapNode>): IHubMapNode {
  return {
    id: "n1",
    sectionType: "HOME",
    districtLabel: "Distrito",
    positionX: 50,
    positionY: 50,
    ...overrides,
  };
}

function createSection(overrides?: Partial<IHubSection>): IHubSection {
  return {
    id: "home",
    type: "HOME",
    title: "Arsenal",
    description: "Gestiona mazos.",
    href: "/hub/arsenal",
    isLocked: false,
    lockReason: null,
    ...overrides,
  };
}

function createProps(overrides?: Partial<IHubSceneNode3DComparableProps>): IHubSceneNode3DComparableProps {
  return {
    node: createNode(),
    section: createSection(),
    nodeEntryDelay: 0,
    showActionPanel: true,
    isTargetNode: false,
    isNavigationBusy: false,
    onNodeHoverSound: vi.fn(),
    onNavigate: vi.fn(),
    ...overrides,
  };
}

describe("areHubSceneNode3DPropsEqual", () => {
  it("devuelve true cuando las props relevantes son iguales", () => {
    const previous = createProps();
    const next = createProps({
      onNodeHoverSound: previous.onNodeHoverSound,
      onNavigate: previous.onNavigate,
    });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(true);
  });

  it("detecta cambio de nodo", () => {
    const previous = createProps();
    const next = createProps({ node: createNode({ positionX: 60 }) });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(false);
  });

  it("detecta cambio de sección", () => {
    const previous = createProps();
    const next = createProps({ section: createSection({ title: "Otro" }) });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(false);
  });

  it("detecta cambio de estado de navegación", () => {
    const previous = createProps();
    const next = createProps({ isNavigationBusy: true });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(false);
  });

  it("detecta cambio de nodo objetivo", () => {
    const previous = createProps();
    const next = createProps({ isTargetNode: true });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(false);
  });

  it("detecta cambio de callback de navegación", () => {
    const previous = createProps();
    const next = createProps({ onNavigate: vi.fn() });
    expect(areHubSceneNode3DPropsEqual(previous, next)).toBe(false);
  });
});

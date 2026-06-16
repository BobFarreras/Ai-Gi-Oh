// src/components/hub/guided-tour/internal/use-hub-tour.test.ts - Tests del hook de estado del tour guiado del Hub.
import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHubTour } from "./use-hub-tour";

const NODES = [
  { id: "node-market", sectionType: "MARKET" as const, districtLabel: "Comercial", positionX: 24, positionY: 58 },
  { id: "node-home", sectionType: "HOME" as const, districtLabel: "Base", positionX: 50, positionY: 70 },
  { id: "node-story", sectionType: "STORY" as const, districtLabel: "Historia", positionX: 36, positionY: 30 },
];

describe("useHubTour", () => {
  it("permanece inactivo cuando isEnabled es false", () => {
    const { result } = renderHook(() =>
      useHubTour({ initialCompletedNodeIds: [], isSkipped: false, nodes: NODES, onSkip: vi.fn(), isEnabled: false }),
    );
    expect(result.current.isActive).toBe(false);
    expect(result.current.activeNodeId).toBeNull();
    expect(result.current.disabledNodeIds).toEqual([]);
  });

  it("activa el tour en Market cuando no hay nodos completados", () => {
    const { result } = renderHook(() =>
      useHubTour({ initialCompletedNodeIds: [], isSkipped: false, nodes: NODES, onSkip: vi.fn(), isEnabled: true }),
    );
    expect(result.current.isActive).toBe(true);
    expect(result.current.activeNodeId).toBe("node-market");
    expect(result.current.disabledNodeIds).toEqual(["node-home", "node-story"]);
  });

  it("avanza a Arsenal tras completar Market", () => {
    const { result } = renderHook(() =>
      useHubTour({
        initialCompletedNodeIds: ["tutorial-market-basics"],
        isSkipped: false,
        nodes: NODES,
        onSkip: vi.fn(),
        isEnabled: true,
      }),
    );
    expect(result.current.activeNodeId).toBe("node-home");
    expect(result.current.disabledNodeIds).toEqual(["node-market", "node-story"]);
  });

  it("marca navegación cuando se selecciona un nodo no de combate", () => {
    const { result } = renderHook(() =>
      useHubTour({ initialCompletedNodeIds: [], isSkipped: false, nodes: NODES, onSkip: vi.fn(), isEnabled: true }),
    );
    act(() => result.current.dismissStepIntro());
    act(() => result.current.onTourNodeSelect());
    expect(result.current.uiPhase).toBe("navigating");
  });

  it("abre simulación de Story cuando el paso activo es combate", () => {
    const { result } = renderHook(() =>
      useHubTour({
        initialCompletedNodeIds: ["tutorial-market-basics", "tutorial-arsenal-basics"],
        isSkipped: false,
        nodes: NODES,
        onSkip: vi.fn(),
        isEnabled: true,
      }),
    );
    expect(result.current.currentStep?.id).toBe("combat");
    act(() => result.current.onTourNodeSelect());
    expect(result.current.uiPhase).toBe("story-simulation");
  });

  it("arranca siempre en step-intro cuando el tour está activo", () => {
    const { result } = renderHook(() =>
      useHubTour({ initialCompletedNodeIds: [], isSkipped: false, nodes: NODES, onSkip: vi.fn(), isEnabled: true }),
    );
    expect(result.current.uiPhase).toBe("step-intro");
  });

  it("pasa a guiding al descartar el buff intro", () => {
    const { result } = renderHook(() =>
      useHubTour({
        initialCompletedNodeIds: ["tutorial-market-basics"],
        isSkipped: false,
        nodes: NODES,
        onSkip: vi.fn(),
        isEnabled: true,
      }),
    );
    act(() => result.current.dismissStepIntro());
    expect(result.current.uiPhase).toBe("guiding");
  });

  it("cierra simulación y permite volver al Hub", () => {
    const { result } = renderHook(() =>
      useHubTour({
        initialCompletedNodeIds: ["tutorial-market-basics", "tutorial-arsenal-basics"],
        isSkipped: false,
        nodes: NODES,
        onSkip: vi.fn(),
        isEnabled: true,
      }),
    );
    act(() => result.current.dismissStepIntro());
    act(() => result.current.onTourNodeSelect());
    act(() => result.current.closeStorySimulation());
    expect(result.current.uiPhase).toBe("guiding");
  });
});

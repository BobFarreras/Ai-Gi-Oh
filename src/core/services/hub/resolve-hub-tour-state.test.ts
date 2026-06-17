// src/core/services/hub/resolve-hub-tour-state.test.ts - Tests de la resolución pura del estado del tour.
import { describe, expect, it } from "vitest";
import { resolveHubTourState } from "./resolve-hub-tour-state";

describe("resolveHubTourState", () => {
  it("inicia el tour en Market cuando no hay nodos completados", () => {
    const state = resolveHubTourState({ completedTutorialNodeIds: [] });
    expect(state.currentStepId).toBe("market");
    expect(state.isFinished).toBe(false);
    expect(state.isSkipped).toBe(false);
  });

  it("avanza a Arsenal tras completar Market", () => {
    const state = resolveHubTourState({ completedTutorialNodeIds: ["tutorial-market-basics"] });
    expect(state.currentStepId).toBe("arsenal");
    expect(state.completedStepIds).toEqual(["market"]);
  });

  it("avanza a Combate tras completar Market y Arsenal", () => {
    const state = resolveHubTourState({
      completedTutorialNodeIds: ["tutorial-market-basics", "tutorial-arsenal-basics"],
    });
    expect(state.currentStepId).toBe("combat");
  });

  it("marca el tour como finalizado cuando todos los nodos están completos", () => {
    const state = resolveHubTourState({
      completedTutorialNodeIds: [
        "tutorial-market-basics",
        "tutorial-arsenal-basics",
        "tutorial-combat-basics",
      ],
    });
    expect(state.currentStepId).toBeNull();
    expect(state.isFinished).toBe(true);
    expect(state.completedStepIds).toEqual(["market", "arsenal", "combat"]);
  });

  it("ignora ids de nodos desconocidos", () => {
    const state = resolveHubTourState({
      completedTutorialNodeIds: ["tutorial-market-basics", "unknown-node"],
    });
    expect(state.currentStepId).toBe("arsenal");
  });

  it("marca el tour como saltado cuando isSkipped es true", () => {
    const state = resolveHubTourState({ isSkipped: true });
    expect(state.currentStepId).toBeNull();
    expect(state.isFinished).toBe(true);
    expect(state.isSkipped).toBe(true);
    expect(state.completedStepIds).toEqual([]);
  });
});

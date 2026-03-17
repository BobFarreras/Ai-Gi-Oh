// src/services/story/resolve-story-smart-action.test.ts - Cubre reglas del botón inteligente Story para mover/interactuar con un solo CTA.
import { describe, expect, it } from "vitest";
import { resolveStorySmartAction } from "@/services/story/resolve-story-smart-action";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function node(): IStoryMapNodeRuntime {
  return {
    id: "story-node",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "Sistema",
    nodeType: "REWARD_NEXUS",
    difficulty: "ROOKIE",
    rewardNexus: 200,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId: null,
    href: "#",
  };
}

describe("resolveStorySmartAction", () => {
  it("usa modo MOVE_AND_PRIMARY cuando puede mover e interactuar", () => {
    const action = resolveStorySmartAction({
      selectedNode: node(),
      canMove: true,
      primaryAction: { label: "Recoger recompensa", mode: "VIRTUAL_INTERACTION", isEnabled: true },
    });
    expect(action.mode).toBe("MOVE_AND_PRIMARY");
    expect(action.isEnabled).toBe(true);
  });

  it("usa modo MOVE cuando solo puede mover", () => {
    const action = resolveStorySmartAction({
      selectedNode: node(),
      canMove: true,
      primaryAction: { label: "Nodo resuelto", mode: "DISABLED", isEnabled: false },
    });
    expect(action).toEqual({ label: "Moverse a nodo", mode: "MOVE", isEnabled: true });
  });

  it("usa modo PRIMARY cuando no puede mover y la acción está habilitada", () => {
    const action = resolveStorySmartAction({
      selectedNode: node(),
      canMove: false,
      primaryAction: { label: "Entrar al duelo", mode: "ROUTE", isEnabled: true },
    });
    expect(action).toEqual({ label: "Entrar al duelo", mode: "PRIMARY", isEnabled: true });
  });
});

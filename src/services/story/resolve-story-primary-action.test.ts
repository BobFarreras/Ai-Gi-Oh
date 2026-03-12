// src/services/story/resolve-story-primary-action.test.ts - Valida la intención de acción principal para nodos Story runtime.
import { describe, expect, it } from "vitest";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(overrides: Partial<IStoryMapNodeRuntime> = {}): IStoryMapNodeRuntime {
  return {
    id: "story-ch1-duel-1",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "NPC",
    nodeType: "DUEL",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    unlockRequirementNodeId: null,
    href: "/hub/story/chapter/1/duel/1",
    ...overrides,
  };
}

describe("resolveStoryPrimaryAction", () => {
  it("resuelve navegación real para nodos de duelo no virtuales", () => {
    const action = resolveStoryPrimaryAction(createNode());

    expect(action.mode).toBe("ROUTE");
    expect(action.isEnabled).toBe(true);
  });

  it("resuelve interacción virtual para nodos virtuales", () => {
    const action = resolveStoryPrimaryAction(createNode({ nodeType: "EVENT", href: "#", isVirtualNode: true }));

    expect(action.mode).toBe("VIRTUAL_INTERACTION");
    expect(action.label).toBe("Activar evento");
  });

  it("mantiene acción de duelo en boss virtual sin navegación directa", () => {
    const action = resolveStoryPrimaryAction(
      createNode({ nodeType: "BOSS", href: "#", isVirtualNode: true, isBossDuel: true }),
    );

    expect(action.mode).toBe("VIRTUAL_INTERACTION");
    expect(action.label).toBe("Entrar al duelo");
  });

  it("deshabilita acción cuando el nodo está bloqueado", () => {
    const action = resolveStoryPrimaryAction(createNode({ isUnlocked: false }));

    expect(action.mode).toBe("DISABLED");
    expect(action.isEnabled).toBe(false);
  });

  it("deshabilita acción cuando el nodo ya está resuelto", () => {
    const action = resolveStoryPrimaryAction(createNode({ isCompleted: true }));

    expect(action.mode).toBe("DISABLED");
    expect(action.label).toBe("Nodo resuelto");
  });
});

// src/services/story/merge-story-map-visual-definition.test.ts - Valida la fusión de runtime Story con layout visual local por actos.
import { describe, expect, it } from "vitest";
import { mergeStoryMapVisualDefinition } from "@/services/story/merge-story-map-visual-definition";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createRuntimeNode(input: Partial<IStoryMapNodeRuntime> & Pick<IStoryMapNodeRuntime, "id">): IStoryMapNodeRuntime {
  return {
    id: input.id,
    chapter: input.chapter ?? 1,
    duelIndex: input.duelIndex ?? 1,
    title: input.title ?? "Nodo",
    opponentName: input.opponentName ?? "Oponente",
    nodeType: input.nodeType ?? "DUEL",
    difficulty: input.difficulty ?? "ROOKIE",
    rewardNexus: input.rewardNexus ?? 0,
    rewardPlayerExperience: input.rewardPlayerExperience ?? 0,
    isBossDuel: input.isBossDuel ?? false,
    isCompleted: input.isCompleted ?? false,
    isUnlocked: input.isUnlocked ?? true,
    unlockRequirementNodeId: input.unlockRequirementNodeId ?? null,
    href: input.href ?? "/hub/story/chapter/1/duel/1",
  };
}

describe("mergeStoryMapVisualDefinition", () => {
  it("inyecta posición visual si existe definición local", () => {
    const nodes = [createRuntimeNode({ id: "story-ch1-duel-1" })];

    const merged = mergeStoryMapVisualDefinition(nodes, {});

    expect(merged[0]?.position).toEqual({ x: 780, y: 980 });
  });

  it("mantiene nodos sin cambios si no hay definición visual", () => {
    const nodes = [createRuntimeNode({ id: "story-ch9-duel-99", unlockRequirementNodeId: "story-ch9-duel-98" })];

    const merged = mergeStoryMapVisualDefinition(nodes, {});

    expect(merged[0]?.position).toBeUndefined();
    expect(merged[0]?.unlockRequirementNodeId).toBe("story-ch9-duel-98");
  });

  it("agrega nodos virtuales desbloqueados cuando su dependencia está completada", () => {
    const nodes = [
      createRuntimeNode({ id: "story-ch1-duel-1", isCompleted: true, isUnlocked: true }),
      createRuntimeNode({
        id: "story-ch1-duel-2",
        isCompleted: false,
        isUnlocked: true,
        unlockRequirementNodeId: "story-ch1-duel-1",
      }),
    ];

    const merged = mergeStoryMapVisualDefinition(nodes, {
      visitedNodeIds: ["story-ch1-duel-1"],
    });
    const virtualNode = merged.find((node) => node.id === "story-ch1-reward-nexus-beta");

    expect(virtualNode?.isVirtualNode).toBe(true);
    expect(virtualNode?.isUnlocked).toBe(true);
  });

  it("mantiene nodo virtual bloqueado si su dependencia no está completada", () => {
    const nodes = [createRuntimeNode({ id: "story-ch1-duel-1", isCompleted: false, isUnlocked: true })];
    const merged = mergeStoryMapVisualDefinition(nodes, {});
    const virtualNode = merged.find((node) => node.id === "story-ch1-reward-nexus-beta");

    expect(virtualNode?.isUnlocked).toBe(false);
  });

  it("mantiene desbloqueado un nodo visitado aunque su regla actual lo bloqueara", () => {
    const nodes = [createRuntimeNode({ id: "story-ch1-duel-1", isCompleted: false, isUnlocked: true })];
    const merged = mergeStoryMapVisualDefinition(nodes, {
      visitedNodeIds: ["story-ch1-reward-nexus-beta"],
    });
    const virtualNode = merged.find((node) => node.id === "story-ch1-reward-nexus-beta");

    expect(virtualNode?.isUnlocked).toBe(true);
  });

  it("desbloquea el siguiente nodo MOVE cuando la dependencia MOVE es el nodo actual", () => {
    const nodes = [createRuntimeNode({ id: "story-ch1-duel-1", isCompleted: false, isUnlocked: true })];
    const merged = mergeStoryMapVisualDefinition(nodes, {
      currentNodeId: "story-ch1-player-start",
    });
    const moveNode = merged.find((node) => node.id === "story-ch1-path-blank-1");

    expect(moveNode?.nodeType).toBe("MOVE");
    expect(moveNode?.isUnlocked).toBe(true);
  });

  it("mantiene bloqueado el duelo si no se ha alcanzado la plataforma previa", () => {
    const nodes = [createRuntimeNode({ id: "story-ch1-duel-1", isCompleted: false, isUnlocked: true })];
    const merged = mergeStoryMapVisualDefinition(nodes, {
      currentNodeId: "story-ch1-player-start",
    });
    const duelNode = merged.find((node) => node.id === "story-ch1-duel-1");

    expect(duelNode?.isUnlocked).toBe(false);
  });
});

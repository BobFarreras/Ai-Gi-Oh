// src/components/hub/story/internal/scene/state/story-scene-store.test.ts - Verifica desbloqueo inmediato y persistencia de retroceso en store local Story.
import { describe, expect, it } from "vitest";
import { createStorySceneStore } from "./story-scene-store";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(input: Partial<IStoryMapNodeRuntime> & { id: string }): IStoryMapNodeRuntime {
  return {
    id: input.id,
    chapter: input.chapter ?? 1,
    duelIndex: input.duelIndex ?? 1,
    title: input.title ?? input.id,
    opponentName: input.opponentName ?? "CPU",
    nodeType: input.nodeType ?? "MOVE",
    difficulty: input.difficulty ?? "STANDARD",
    rewardNexus: input.rewardNexus ?? 0,
    rewardPlayerExperience: input.rewardPlayerExperience ?? 0,
    isBossDuel: input.isBossDuel ?? false,
    isCompleted: input.isCompleted ?? false,
    isUnlocked: input.isUnlocked ?? false,
    unlockRequirementNodeId: input.unlockRequirementNodeId ?? null,
    href: input.href ?? "/hub/story/chapter/1/duel/1",
    isVirtualNode: input.isVirtualNode,
    position: input.position,
    rewardCardId: input.rewardCardId,
  };
}

describe("createStorySceneStore", () => {
  it("desbloquea el duelo siguiente justo al moverse a plataforma previa", () => {
    const store = createStorySceneStore({
      currentNodeId: "story-start",
      nodes: [
        createNode({ id: "story-start", nodeType: "MOVE", isUnlocked: true }),
        createNode({ id: "story-blank", nodeType: "MOVE", unlockRequirementNodeId: "story-start", isUnlocked: false }),
        createNode({ id: "story-duel-1", nodeType: "DUEL", unlockRequirementNodeId: "story-blank", isUnlocked: false }),
      ],
    });

    store.getState().setCurrentNodeId("story-blank");

    const state = store.getState();
    expect(state.nodesById["story-blank"]?.isCompleted).toBe(true);
    expect(state.nodesById["story-duel-1"]?.isUnlocked).toBe(true);
  });
});

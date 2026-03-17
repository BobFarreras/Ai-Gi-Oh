// src/components/hub/story/internal/map/story-opponent-avatar.test.ts - Valida fallback de avatar para nodos de combate Story.
import { describe, expect, it } from "vitest";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryOpponentAvatarUrl, STORY_DEFAULT_OPPONENT_AVATAR_URL } from "./story-opponent-avatar";

function createNode(avatarUrl?: string | null): IStoryMapNodeRuntime {
  return {
    id: "node-1",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "Rival",
    opponentAvatarUrl: avatarUrl ?? null,
    nodeType: "DUEL",
    difficulty: "ROOKIE",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "/hub/story/chapter/1/duel/1",
  };
}

describe("story-opponent-avatar", () => {
  it("usa avatar del nodo cuando existe", () => {
    expect(resolveStoryOpponentAvatarUrl(createNode("/assets/custom/avatar.png"))).toBe("/assets/custom/avatar.png");
  });

  it("aplica fallback estable cuando no hay avatar", () => {
    expect(resolveStoryOpponentAvatarUrl(createNode(null))).toBe(STORY_DEFAULT_OPPONENT_AVATAR_URL);
    expect(resolveStoryOpponentAvatarUrl(null)).toBe(STORY_DEFAULT_OPPONENT_AVATAR_URL);
  });
});


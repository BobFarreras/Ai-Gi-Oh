// src/components/hub/story/internal/scene/view/resolve-story-mobile-detail-availability.test.ts - Verifica cuándo habilitar el detalle en Story móvil.
import { describe, expect, it } from "vitest";
import { resolveStoryMobileDetailAvailability } from "./resolve-story-mobile-detail-availability";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

function createNode(overrides: Partial<IStoryMapNodeRuntime>): IStoryMapNodeRuntime {
  return {
    id: "story-node",
    chapter: 1,
    duelIndex: 1,
    title: "Nodo",
    opponentName: "",
    nodeType: "DUEL",
    difficulty: "STANDARD",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "#",
    ...overrides,
  };
}

describe("resolveStoryMobileDetailAvailability", () => {
  it("deshabilita detalle cuando no hay nodo seleccionado", () => {
    expect(resolveStoryMobileDetailAvailability(null)).toBe(false);
  });

  it("deshabilita detalle para nodo MOVE", () => {
    expect(resolveStoryMobileDetailAvailability(createNode({ nodeType: "MOVE" }))).toBe(false);
  });

  it("habilita detalle para nodos con interacción", () => {
    expect(resolveStoryMobileDetailAvailability(createNode({ nodeType: "DUEL" }))).toBe(true);
    expect(resolveStoryMobileDetailAvailability(createNode({ nodeType: "EVENT" }))).toBe(true);
  });
});


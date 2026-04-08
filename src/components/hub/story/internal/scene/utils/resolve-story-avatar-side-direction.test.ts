// src/components/hub/story/internal/scene/utils/resolve-story-avatar-side-direction.test.ts - Valida la dirección lateral del avatar según vector de desplazamiento entre nodos.
import { describe, expect, it } from "vitest";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryAvatarSideDirection } from "./resolve-story-avatar-side-direction";

function buildNode(id: string, x: number, y: number): IStoryMapNodeRuntime {
  return {
    id,
    chapter: 1,
    duelIndex: 1,
    title: id,
    opponentName: "Test",
    nodeType: "MOVE",
    difficulty: "EASY",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    isCompleted: false,
    isUnlocked: true,
    href: "/",
    position: { x, y },
  };
}

describe("resolveStoryAvatarSideDirection", () => {
  it("resuelve LEFT cuando avanza hacia la derecha para quedar delante del nodo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 0), buildNode("b", 2, 1))).toBe("LEFT");
  });

  it("resuelve RIGHT cuando avanza hacia la izquierda para quedar delante del nodo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 5, 0), buildNode("b", 1, 1))).toBe("RIGHT");
  });

  it("resuelve UP cuando avanza hacia abajo para quedar delante del nodo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 1), buildNode("b", 1, 4))).toBe("UP");
  });

  it("resuelve DOWN cuando avanza hacia arriba para quedar delante del nodo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 5), buildNode("b", 1, 1))).toBe("DOWN");
  });

  it("cae en LEFT cuando faltan coordenadas", () => {
    expect(resolveStoryAvatarSideDirection(null, null)).toBe("LEFT");
  });
});

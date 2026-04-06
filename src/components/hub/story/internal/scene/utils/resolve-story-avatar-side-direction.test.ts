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
  it("resuelve RIGHT cuando el vector dominante es horizontal positivo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 0), buildNode("b", 2, 1))).toBe("RIGHT");
  });

  it("resuelve LEFT cuando el vector dominante es horizontal negativo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 5, 0), buildNode("b", 1, 1))).toBe("LEFT");
  });

  it("resuelve DOWN cuando el vector dominante es vertical positivo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 1), buildNode("b", 1, 4))).toBe("DOWN");
  });

  it("resuelve UP cuando el vector dominante es vertical negativo", () => {
    expect(resolveStoryAvatarSideDirection(buildNode("a", 0, 5), buildNode("b", 1, 1))).toBe("UP");
  });

  it("cae en LEFT cuando faltan coordenadas", () => {
    expect(resolveStoryAvatarSideDirection(null, null)).toBe("LEFT");
  });
});

// src/core/use-cases/progression/GetSkillTreeStateUseCase.test.ts - Verifica la composición del estado del
// árbol (catálogo + rangos + nivel derivado de la XP).
import { describe, expect, it, vi } from "vitest";
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { GetSkillTreeStateUseCase } from "./GetSkillTreeStateUseCase";

function node(id: string): ISkillTreeNode {
  return { id, branch: "COMBAT", tier: 1, maxRank: 5, costPerRank: 1,
    effect: { kind: "STARTING_LP_BONUS", valuePerRank: 100 }, prerequisites: [], display: { name: id, blurb: "" } };
}

function progressRepo(experience: number | null): IPlayerProgressRepository {
  const progress: IPlayerProgress | null = experience === null ? null : {
    playerId: "p1", hasCompletedTutorial: true, medals: 0, storyChapter: 1, playerExperience: experience,
    updatedAtIso: "2026-07-18T00:00:00.000Z",
  };
  return { getByPlayerId: vi.fn(async () => progress), create: vi.fn(), update: vi.fn() };
}

function skillRepo(catalog: ISkillTreeNode[], ranks: { nodeId: string; rank: number }[]): ISkillTreeRepository {
  return { getActiveCatalog: vi.fn(async () => catalog), getPlayerRanks: vi.fn(async () => ranks), rankUp: vi.fn(), respec: vi.fn() };
}

describe("GetSkillTreeStateUseCase", () => {
  it("deriva nivel/puntos de la XP y compone la vista por nodo", async () => {
    const useCase = new GetSkillTreeStateUseCase(skillRepo([node("a")], [{ nodeId: "a", rank: 2 }]), progressRepo(5400));
    const view = await useCase.execute("p1");
    expect(view.level).toBe(5);         // XP 5400 = nivel 5
    expect(view.pointsTotal).toBe(4);
    expect(view.pointsSpent).toBe(2);  // rango 2 * coste 1
    expect(view.pointsAvailable).toBe(2);
    expect(view.nodes[0].rank).toBe(2);
  });

  it("sin progreso trata la XP como 0 (nivel 1, 0 puntos)", async () => {
    const useCase = new GetSkillTreeStateUseCase(skillRepo([node("a")], []), progressRepo(null));
    const view = await useCase.execute("p1");
    expect(view.level).toBe(1);
    expect(view.pointsAvailable).toBe(0);
  });

  it("rechaza playerId vacío", async () => {
    await expect(new GetSkillTreeStateUseCase(skillRepo([], []), progressRepo(0)).execute(" ")).rejects.toThrow();
  });
});

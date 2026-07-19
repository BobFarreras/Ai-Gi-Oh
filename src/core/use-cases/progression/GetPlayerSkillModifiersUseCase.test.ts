// src/core/use-cases/progression/GetPlayerSkillModifiersUseCase.test.ts - Verifica que los modificadores se
// agregan uniendo el catálogo activo con los rangos del jugador.
import { describe, expect, it, vi } from "vitest";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { SkillEffect } from "@/core/services/progression/skill-tree/skill-effect-types";
import { GetPlayerSkillModifiersUseCase } from "./GetPlayerSkillModifiersUseCase";

function node(id: string, effect: SkillEffect): ISkillTreeNode {
  return { id, branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1, effect, prerequisites: [], display: { name: id, blurb: "" } };
}

function repoWith(catalog: ISkillTreeNode[], ranks: { nodeId: string; rank: number }[]): ISkillTreeRepository {
  return {
    getActiveCatalog: vi.fn(async () => catalog),
    getPlayerRanks: vi.fn(async () => ranks),
    rankUp: vi.fn(),
  } as unknown as ISkillTreeRepository;
}

describe("GetPlayerSkillModifiersUseCase", () => {
  it("une catálogo y rangos y agrega por familia", async () => {
    const repo = repoWith(
      [node("node-econ-comision", { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }),
       node("node-cbt-blindaje", { kind: "STARTING_LP_BONUS", valuePerRank: 100 })],
      [{ nodeId: "node-econ-comision", rank: 5 }, { nodeId: "node-cbt-blindaje", rank: 3 }],
    );
    const mods = await new GetPlayerSkillModifiersUseCase(repo).execute("p1");
    expect(mods.economy.nexusRewardMult).toBeCloseTo(0.1, 10);
    expect(mods.combat.startingLpBonus).toBe(300);
  });

  it("un nodo del catálogo sin rango del jugador no aporta", async () => {
    const repo = repoWith([node("node-econ-comision", { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 })], []);
    const mods = await new GetPlayerSkillModifiersUseCase(repo).execute("p1");
    expect(mods.economy.nexusRewardMult).toBe(0);
  });

  it("un rango de un nodo que ya NO está en el catálogo activo se ignora", async () => {
    // El jugador tiene rango en un nodo desactivado (no está en el catálogo activo) → su efecto se apaga.
    const repo = repoWith([], [{ nodeId: "node-desactivado", rank: 3 }]);
    const mods = await new GetPlayerSkillModifiersUseCase(repo).execute("p1");
    expect(mods.economy.nexusRewardMult).toBe(0);
  });

  it("rechaza playerId vacío", async () => {
    await expect(new GetPlayerSkillModifiersUseCase(repoWith([], [])).execute(" ")).rejects.toThrow();
  });
});

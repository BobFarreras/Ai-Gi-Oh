// src/services/olympus/resolve-champion-deck-preview.test.ts - La vista previa del mazo debe coincidir con lo que saldrá a combatir.
import { describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";

vi.mock("@/services/training/get-arena-catalog", () => ({
  getArenaCatalog: async () => ({
    opponents: {
      "training-tier-1": {
        id: "training-tier-1", codeName: "GENNVIM", displayName: "GenNvim",
        avatarUrl: "/avatar.webp", introUrl: "/intro.webp", storyOpponentId: "gennvim",
        variants: [{
          id: "starter-tools",
          label: "Starter Tools",
          deckCards: [{ cardId: "entity-a", versionTier: null, level: null, xp: null, attackBonus: null, defenseBonus: null }],
          fusionCards: [],
        }],
      },
    },
    cardCatalog: new Map<string, ICard>([
      ["entity-a", { id: "entity-a", name: "Entity A", type: "ENTITY", cost: 3, attack: 1000, defense: 800, renderUrl: null, masteryPassiveSkillId: null } as unknown as ICard],
    ]),
    tiers: [],
  }),
}));

const { resolveChampionDeckPreview } = await import("./resolve-champion-deck-preview");

const champion = {
  id: "gennvim", arenaOpponentId: "training-tier-1", requiredTier: 1, requiredLadderPosition: 1,
  baseDeckVariantId: "starter-tools", baseScale: { level: 14, versionTier: 2, startingLp: 8000 }, version: 1,
};

const node = {
  id: "gennvim-power-1", championId: "gennvim", branch: "POWER" as const, prerequisiteNodeIds: [],
  effect: { kind: "GLOBAL_LEVEL" as const, amount: 5, cap: 100 }, fragmentCost: 40, maxRank: 16, sortOrder: 10,
};

function repositoryWith(overrides: Partial<IOlympusRepository> = {}): IOlympusRepository {
  return {
    getCatalog: async () => ({ settings: {}, legends: [], champions: [champion], nodes: [node] }),
    getUnlockedChampionIds: async () => ["gennvim"],
    getChampionProgress: async () => [
      { championId: "gennvim", unlockedNodeIds: [node.id], nodeRanks: { [node.id]: 3 }, respecCount: 0, version: 1 },
    ],
    ...overrides,
  } as unknown as IOlympusRepository;
}

describe("resolveChampionDeckPreview", () => {
  it("devuelve el mazo con el nivel que suman los rangos comprados", async () => {
    const preview = await resolveChampionDeckPreview(repositoryWith(), "p1", "gennvim");

    // 14 de base + 5 por rango × 3 rangos: exactamente lo que aplicará el snapshot de combate.
    expect(preview.level).toBe(29);
    expect(preview.deck.map((card) => card.level)).toEqual([29]);
    expect(preview.displayName).toBe("GenNvim");
  });

  it("no enseña el mazo de un campeón que el jugador no ha desbloqueado", async () => {
    const repository = repositoryWith({ getUnlockedChampionIds: async () => [] });
    await expect(resolveChampionDeckPreview(repository, "p1", "gennvim")).rejects.toThrow(/derrotar/i);
  });

  it("falla si el campeón ya no está publicado", async () => {
    await expect(resolveChampionDeckPreview(repositoryWith(), "p1", "fantasma")).rejects.toThrow(/publicado/i);
  });
});

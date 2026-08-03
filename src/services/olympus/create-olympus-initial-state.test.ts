// src/services/olympus/create-olympus-initial-state.test.ts - Verifica apertura de cuatro cartas, seeds separadas y asimetría declarada.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { createOlympusInitialState } from "./create-olympus-initial-state";

function deckOf(prefix: string): ICard[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} ${index}`,
    type: "ENTITY",
    energyCost: 1,
    attack: 100,
    defense: 100,
  } as unknown as ICard));
}

const profile: IOlympusChampionBattleProfile = {
  level: 20, versionTier: 4, xp: 6533,
  signatureCardIds: [], signatureLevel: 25,
  startingLp: 8000, energyBonus: 1,
};

const legend = {
  id: "zeus",
  displayName: "Zeus",
  startingLp: 14000,
  energyBonus: 2,
} as IOlympusLegend;

function build(seed: string) {
  return createOlympusInitialState({
    playerId: "player-1",
    championName: "GenNvim",
    championDeck: deckOf("champion"),
    championFusionDeck: [],
    profile,
    legend,
    legendDeck: deckOf("legend"),
    legendFusionDeck: [],
    seed,
  });
}

describe("createOlympusInitialState", () => {
  it("reparte cuatro cartas a cada duelista, igual que el resto del PvE", () => {
    const state = build("seed-a");
    expect(state.playerA.hand).toHaveLength(4);
    expect(state.playerB.hand).toHaveLength(4);
  });

  it("respeta los LP y la energía declarados por cada lado", () => {
    const state = build("seed-a");
    expect(state.playerA).toMatchObject({ healthPoints: 8000, maxHealthPoints: 8000, maxEnergy: 11 });
    expect(state.playerB).toMatchObject({ healthPoints: 14000, maxHealthPoints: 14000, maxEnergy: 12 });
  });

  it("es determinista para una misma seed y distinto entre seeds", () => {
    const first = build("seed-a");
    const repeated = build("seed-a");
    const other = build("seed-b");
    const hand = (state: ReturnType<typeof build>) => state.playerA.hand.map((card) => card.id).join(",");
    expect(hand(first)).toBe(hand(repeated));
    expect(hand(first)).not.toBe(hand(other));
  });

  it("baraja el mazo del rival con un stream propio", () => {
    const state = build("seed-a");
    expect(state.playerB.hand.every((card) => card.id.startsWith("legend"))).toBe(true);
    expect(state.playerB.hand.map((card) => card.id))
      .not.toEqual(deckOf("legend").slice(0, 4).map((card) => card.id));
  });
});

// src/services/survival/create-survival-initial-state.test.ts - Verifica manos y turno inicial entre combates Survival consecutivos.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { createSurvivalInitialState } from "./create-survival-initial-state";

function createDeck(prefix: string): ICard[] {
  return Array.from({ length: 20 }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} ${index}`,
    description: "Carta de integración.",
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    archetype: "TOOL",
    cost: 1,
    attack: 100,
    defense: 100,
    level: 0,
    xp: 0,
    versionTier: 0,
    renderUrl: "/test.webp",
  }));
}

const run = { currentLp: 6200, maxLp: 8000 } as ISurvivalRun;
const encounter = {
  opponentId: "opponent-1",
  maxLpBonus: 0,
} as ISurvivalEncounter;

function build(seed: string) {
  return createSurvivalInitialState({
    playerId: "player-1",
    playerDeck: createDeck("player"),
    playerFusionDeck: [],
    opponentName: "Rival",
    opponentDeck: createDeck("opponent"),
    opponentFusionDeck: [],
    run,
    encounter,
    seed,
  });
}

const cardIds = (cards: ICard[]) => cards.map(({ id }) => id);

describe("createSurvivalInitialState", () => {
  it("genera manos distintas para ambos duelistas en combates consecutivos", () => {
    const first = build("battle-seed-1");
    const second = build("battle-seed-2");

    expect(first.playerA.hand).toHaveLength(4);
    expect(first.playerB.hand).toHaveLength(4);
    expect(cardIds(second.playerA.hand)).not.toEqual(cardIds(first.playerA.hand));
    expect(cardIds(second.playerB.hand)).not.toEqual(cardIds(first.playerB.hand));
  });

  it("mantiene replay determinista y sortea ambos posibles iniciadores", () => {
    const first = build("battle-seed-1");
    const replay = build("battle-seed-1");
    expect({ ...replay, idFactory: undefined }).toEqual({ ...first, idFactory: undefined });
    const starters = new Set(
      Array.from({ length: 12 }, (_, index) => build(`starter-${index}`).startingPlayerId),
    );
    expect(starters).toEqual(new Set(["player-1", "opponent-1"]));
  });
});

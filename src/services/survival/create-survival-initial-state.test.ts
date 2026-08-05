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

  it("aplica la energía solo al jugador y no duplica el bonus de LP ya persistido en la run", () => {
    const state = createSurvivalInitialState({
      playerId: "player-1",
      playerDeck: createDeck("player"),
      playerFusionDeck: [],
      opponentName: "Rival",
      opponentDeck: createDeck("opponent"),
      opponentFusionDeck: [],
      run,
      encounter,
      seed: "battle-seed-modifiers",
      playerCombatModifiers: {
        startingLpBonus: 300,
        maxEnergyBonus: 2,
        turn1EnergyBonus: 0,
        openingHandBonus: 0,
        openingMulligan: false,
      },
    });
    // La run es la fuente del LP efectivo; sumar otra vez el modifier rompería la validación de liquidación.
    expect(state.playerA.maxHealthPoints).toBe(run.maxLp);
    expect(state.playerA.healthPoints).toBe(run.currentLp);
    expect(state.playerA.maxEnergy).toBe(12);
    expect(state.playerA.currentEnergy).toBe(12);
    // El rival no recibe el bonus del árbol del jugador.
    expect(state.playerB.maxHealthPoints).toBe(run.maxLp);
    expect(state.playerB.maxEnergy).toBe(10);
  });

  it("Arranque en Frío: aplica +energía en el turno 1 del jugador, concedida o diferida según arranque", () => {
    const state = createSurvivalInitialState({
      playerId: "player-1",
      playerDeck: createDeck("player"),
      playerFusionDeck: [],
      opponentName: "Rival",
      opponentDeck: createDeck("opponent"),
      opponentFusionDeck: [],
      run,
      encounter,
      seed: "battle-seed-frost",
      playerCombatModifiers: {
        startingLpBonus: 0,
        maxEnergyBonus: 0,
        turn1EnergyBonus: 1,
        openingHandBonus: 0,
        openingMulligan: false,
      },
    });
    const isStarter = state.startingPlayerId === "player-1";
    // Si arranca, la energía extra se concede ya (por encima del tope); si no, se difiere al motor.
    if (isStarter) {
      expect(state.playerA.currentEnergy).toBe(11);
      expect(state.firstTurnEnergyBonusByPlayerId?.["player-1"] ?? 0).toBe(0);
    } else {
      expect(state.playerA.currentEnergy).toBe(10);
      expect(state.firstTurnEnergyBonusByPlayerId?.["player-1"]).toBe(1);
    }
    expect(state.playerA.maxEnergy).toBe(10);
  });

  it("sin modifiers no altera los valores por defecto", () => {
    const state = createSurvivalInitialState({
      playerId: "player-1",
      playerDeck: createDeck("player"),
      playerFusionDeck: [],
      opponentName: "Rival",
      opponentDeck: createDeck("opponent"),
      opponentFusionDeck: [],
      run,
      encounter,
      seed: "battle-seed-plain",
    });
    expect(state.playerA.maxHealthPoints).toBe(run.maxLp);
    expect(state.playerA.healthPoints).toBe(run.currentLp);
    expect(state.playerA.maxEnergy).toBe(10);
    expect(state.playerB.maxHealthPoints).toBe(run.maxLp);
  });
});

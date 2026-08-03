// src/components/game/board/hooks/internal/boardInitialState.test.ts - Verifica inicialización del tablero con mazo persistido y fallback mock.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { createInitialBoardState } from "./boardInitialState";

function createCard(id: string): ICard {
  return {
    id,
    name: id,
    description: id,
    type: "ENTITY",
    faction: "OPEN_SOURCE",
    cost: 3,
    attack: 1200,
    defense: 1100,
  };
}

describe("boardInitialState", () => {
  it("usa mazo persistido si se proporciona", () => {
    const persistedDeck = Array.from({ length: 20 }, (_, index) => createCard(`persisted-${index}`));
    const state = createInitialBoardState({ playerDeck: persistedDeck });
    expect(state.playerA.hand).toHaveLength(4);
    const persistedIds = new Set(persistedDeck.map((card) => card.id));
    expect(state.playerA.hand.every((card) => persistedIds.has(card.id))).toBe(true);
  });

  it("usa fallback mock cuando no hay mazo persistido", () => {
    const state = createInitialBoardState();
    expect(state.playerA.hand.length + state.playerA.deck.length).toBe(20);
  });

  it("mantiene orden y runtimeIds deterministas con la misma seed", () => {
    const seed = "seed-deterministic-board";
    const firstState = createInitialBoardState({ seed });
    const secondState = createInitialBoardState({ seed });

    const firstHandRuntimeIds = firstState.playerA.hand.map((card) => card.runtimeId);
    const secondHandRuntimeIds = secondState.playerA.hand.map((card) => card.runtimeId);
    expect(firstHandRuntimeIds).toEqual(secondHandRuntimeIds);
    expect(firstState.playerA.hand.map((card) => card.id)).toEqual(secondState.playerA.hand.map((card) => card.id));
  });

  it("aplica el bonus de combate del árbol SOLO al jugador local (playerA), nunca al rival", () => {
    const base = createInitialBoardState();
    const state = createInitialBoardState({ playerStartingLpBonus: 300, playerMaxEnergyBonus: 2 });
    expect(state.playerA.maxHealthPoints).toBe(base.playerA.maxHealthPoints + 300);
    expect(state.playerA.healthPoints).toBe(base.playerA.healthPoints + 300);
    expect(state.playerA.maxEnergy).toBe(base.playerA.maxEnergy + 2);
    expect(state.playerA.currentEnergy).toBe(base.playerA.currentEnergy + 2);
    // El rival queda intacto.
    expect(state.playerB.maxHealthPoints).toBe(base.playerB.maxHealthPoints);
    expect(state.playerB.maxEnergy).toBe(base.playerB.maxEnergy);
  });

  it("sin bonus deja el estado base sin tocar", () => {
    const state = createInitialBoardState({ playerStartingLpBonus: 0, playerMaxEnergyBonus: 0 });
    expect(state.playerA.maxHealthPoints).toBe(8000);
    expect(state.playerA.maxEnergy).toBe(10);
  });

  it("Arranque en Frío: si el jugador ARRANCA, concede la energía extra en el turno 1 por encima del tope", () => {
    const state = createInitialBoardState({ playerId: "me", starterPlayerId: "me", opponentId: "rival", playerTurn1EnergyBonus: 1 });
    // maxEnergy 10, pero el turno 1 (ya activo) arranca con 11.
    expect(state.playerA.currentEnergy).toBe(11);
    expect(state.playerA.maxEnergy).toBe(10);
    expect(state.firstTurnEnergyBonusByPlayerId?.me ?? 0).toBe(0);
  });

  it("Arranque en Frío: si el jugador NO arranca, difiere la energía a su primer turno (motor)", () => {
    const state = createInitialBoardState({ playerId: "me", starterPlayerId: "rival", opponentId: "rival", playerTurn1EnergyBonus: 1 });
    expect(state.playerA.currentEnergy).toBe(10); // aún no se concede
    expect(state.firstTurnEnergyBonusByPlayerId?.me).toBe(1);
  });

  it("aplica el bonus de habilidad del OPONENTE al rival (playerB), sin tocar al jugador local", () => {
    const base = createInitialBoardState();
    const state = createInitialBoardState({ opponentStartingLpBonus: 500, opponentMaxEnergyBonus: 1 });
    expect(state.playerB.maxHealthPoints).toBe(base.playerB.maxHealthPoints + 500);
    expect(state.playerB.healthPoints).toBe(base.playerB.healthPoints + 500);
    expect(state.playerB.maxEnergy).toBe(base.playerB.maxEnergy + 1);
    expect(state.playerB.currentEnergy).toBe(base.playerB.currentEnergy + 1);
    // El jugador local queda intacto.
    expect(state.playerA.maxHealthPoints).toBe(base.playerA.maxHealthPoints);
    expect(state.playerA.maxEnergy).toBe(base.playerA.maxEnergy);
  });

  it("Arranque en Frío del oponente: si el rival ARRANCA, concede su energía de turno 1 por encima del tope", () => {
    const state = createInitialBoardState({ playerId: "me", opponentId: "rival", starterPlayerId: "rival", opponentTurn1EnergyBonus: 1 });
    expect(state.playerB.currentEnergy).toBe(11);
    expect(state.playerB.maxEnergy).toBe(10);
    expect(state.firstTurnEnergyBonusByPlayerId?.rival ?? 0).toBe(0);
  });

  it("Arranque en Frío del oponente: si el rival NO arranca, difiere su energía a su primer turno", () => {
    const state = createInitialBoardState({ playerId: "me", opponentId: "rival", starterPlayerId: "me", opponentTurn1EnergyBonus: 1 });
    expect(state.playerB.currentEnergy).toBe(10);
    expect(state.firstTurnEnergyBonusByPlayerId?.rival).toBe(1);
  });

  it("aplica bonus a jugador y oponente a la vez sin interferencia entre lados", () => {
    const base = createInitialBoardState();
    const state = createInitialBoardState({ playerStartingLpBonus: 300, opponentStartingLpBonus: 500 });
    expect(state.playerA.maxHealthPoints).toBe(base.playerA.maxHealthPoints + 300);
    expect(state.playerB.maxHealthPoints).toBe(base.playerB.maxHealthPoints + 500);
  });

  it("transporta LP actuales sin reducir el máximo ni perder el bonus permitido", () => {
    const state = createInitialBoardState({ playerStartingHealthPoints: 2400, playerStartingLpBonus: 300 });
    expect(state.playerA.healthPoints).toBe(2700);
    expect(state.playerA.maxHealthPoints).toBe(8300);
  });

  it("permite inyectar identidad de jugador y oponente sin hardcode local", () => {
    const state = createInitialBoardState({
      playerId: "player-123",
      playerName: "Boby",
      opponentId: "opponent-abc",
      opponentName: "Story Boss",
    });
    expect(state.playerA.id).toBe("player-123");
    expect(state.playerA.name).toBe("Boby");
    expect(state.playerB.id).toBe("opponent-abc");
    expect(state.playerB.name).toBe("Story Boss");
  });
});

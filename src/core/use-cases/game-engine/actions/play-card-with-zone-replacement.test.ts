// src/core/use-cases/game-engine/actions/play-card-with-zone-replacement.test.ts - Verifica reemplazo en zona de ejecuciones para magias/trampas cuando el campo está lleno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { discardBoardCardForZoneReplacement, playCardWithZoneReplacement } from "./play-card-with-zone-replacement";
import { playCard } from "./play-card";
import { GameState } from "../state/types";

const spellCard: ICard = {
  id: "exec-new",
  name: "Nueva Ejecución",
  description: "Prueba de reemplazo.",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: { action: "HEAL", target: "PLAYER", value: 200 },
};

function createExecution(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    mode: "SET",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
    card: { ...spellCard, id: cardId },
  };
}

function createState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      name: "Neo",
      currentEnergy: 8,
      hand: [{ ...spellCard, runtimeId: "runtime-exec-new" }],
      activeExecutions: [createExecution("ex-1", "exec-1"), createExecution("ex-2", "exec-2"), createExecution("ex-3", "exec-3")],
    }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
  });
}

describe("playCardWithZoneReplacement", () => {
  it("reemplaza una ejecución existente y juega la nueva carta en su zona", () => {
    const next = playCardWithZoneReplacement(createState(), "p1", "runtime-exec-new", "SET", "ex-2", "EXECUTIONS");
    expect(next.playerA.activeExecutions).toHaveLength(3);
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "exec-2")).toBe(false);
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "exec-new")).toBe(true);
    expect(next.playerA.graveyard.some((card) => card.id === "exec-2")).toBe(true);
  });
});

describe("discardBoardCardForZoneReplacement", () => {
  it("solo sacrifica la carta elegida al cementerio y libera un hueco (sin jugar la nueva)", () => {
    const next = discardBoardCardForZoneReplacement(createState(), "p1", "ex-2", "EXECUTIONS");
    expect(next.playerA.activeExecutions).toHaveLength(2);
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "exec-2")).toBe(false);
    expect(next.playerA.graveyard.some((card) => card.id === "exec-2")).toBe(true);
    // La carta nueva sigue en la mano: el descarte no la juega (eso es un paso aparte para animarlo).
    expect(next.playerA.hand.some((card) => card.id === "exec-new")).toBe(true);
  });

  it("sacrificio + playCard produce el mismo estado que la versión atómica (determinismo del reemplazo secuenciado)", () => {
    const atomic = playCardWithZoneReplacement(createState(), "p1", "runtime-exec-new", "SET", "ex-2", "EXECUTIONS");
    const sequenced = playCard(discardBoardCardForZoneReplacement(createState(), "p1", "ex-2", "EXECUTIONS"), "p1", "runtime-exec-new", "SET");
    expect(sequenced.playerA.activeExecutions.map((entity) => entity.card.id)).toEqual(atomic.playerA.activeExecutions.map((entity) => entity.card.id));
    expect(sequenced.playerA.graveyard.map((card) => card.id)).toEqual(atomic.playerA.graveyard.map((card) => card.id));
  });
});


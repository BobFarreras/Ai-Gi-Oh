// src/core/use-cases/game-engine/state/mulligan-opening-hand.test.ts - Verifica el rebaraje de la mano de
// apertura: mismo tamaño de mano, conserva el conjunto total de cartas (mano+mazo), y NO toca al rival.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "./types";
import { mulliganOpeningHand } from "./mulligan-opening-hand";

function card(id: string): ICard {
  return { id, runtimeId: `rt-${id}` } as unknown as ICard;
}

function state(): GameState {
  return {
    turn: 1, phase: "MAIN_1", activePlayerId: "p1", startingPlayerId: "p1", pendingTurnAction: null, combatLog: [],
    playerA: { id: "p1", hand: [card("a"), card("b"), card("c"), card("d")], deck: [card("e"), card("f"), card("g"), card("h")] },
    playerB: { id: "p2", hand: [card("x"), card("y")], deck: [card("z")] },
  } as unknown as GameState;
}

const ids = (cards: ICard[]) => cards.map((c) => c.runtimeId).sort();

describe("mulliganOpeningHand", () => {
  it("rehace la mano del jugador con el MISMO tamaño y sin perder/duplicar cartas", () => {
    // RNG determinista que fuerza una permutación distinta a la identidad.
    const seq = [0.9, 0.1, 0.7, 0.2, 0.5, 0.3, 0.8];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    const before = state();
    const next = mulliganOpeningHand(before, "p1", rng);
    expect(next.playerA.hand).toHaveLength(4);
    expect(next.playerA.deck).toHaveLength(4);
    // El conjunto total (mano+mazo) se conserva exactamente (ni se pierden ni se duplican cartas).
    expect(ids([...next.playerA.hand, ...next.playerA.deck])).toEqual(ids([...before.playerA.hand, ...before.playerA.deck]));
  });

  it("NO toca al rival (playerB intacto)", () => {
    const before = state();
    const next = mulliganOpeningHand(before, "p1", () => 0.5);
    expect(next.playerB).toEqual(before.playerB);
  });

  it("devuelve el estado sin cambios si el jugador no existe o no tiene mano", () => {
    const s = state();
    expect(mulliganOpeningHand(s, "desconocido", () => 0.5)).toBe(s);
  });
});

// src/core/services/multiplayer/prepare-multiplayer-match.test.ts - Verifica que ambos clientes generan estado inicial idéntico (determinismo Realtime).
import { describe, it, expect } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { prepareMultiplayerDeck, resolveMultiplayerCoinToss } from "./prepare-multiplayer-match";

function makeDeck(prefix: string, size: number): ICard[] {
  return Array.from({ length: size }, (_, i) => ({ id: `${prefix}-${i}` }) as unknown as ICard);
}

const SEED = "seed-abc-123";
const PLAYER_A = "player-a-uuid";
const PLAYER_B = "player-b-uuid";

describe("prepareMultiplayerDeck", () => {
  it("produce el mismo orden y runtimeId para un mazo dado, sin importar el cliente", () => {
    const deck = makeDeck("entity", 12);

    // Cliente de A: su mazo es 'local' (owner = A). Cliente de B: el mismo mazo es 'opponent' (owner = A).
    const fromClientA = prepareMultiplayerDeck(deck, PLAYER_A, SEED);
    const fromClientB = prepareMultiplayerDeck(deck, PLAYER_A, SEED);

    expect(fromClientB.map((c) => c.runtimeId)).toEqual(fromClientA.map((c) => c.runtimeId));
    expect(fromClientB.map((c) => c.id)).toEqual(fromClientA.map((c) => c.id));
  });

  it("asigna runtimeId únicos con el id del propietario real", () => {
    const prepared = prepareMultiplayerDeck(makeDeck("entity", 10), PLAYER_A, SEED);
    const ids = prepared.map((c) => c.runtimeId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id?.startsWith(PLAYER_A))).toBe(true);
  });

  it("no muta el mazo de entrada", () => {
    const deck = makeDeck("entity", 5);
    const snapshot = deck.map((c) => c.id);
    prepareMultiplayerDeck(deck, PLAYER_A, SEED);
    expect(deck.map((c) => c.id)).toEqual(snapshot);
    expect(deck.every((c) => c.runtimeId === undefined)).toBe(true);
  });

  it("genera distinto orden para propietarios distintos (independencia por jugador)", () => {
    const deck = makeDeck("entity", 16);
    const forA = prepareMultiplayerDeck(deck, PLAYER_A, SEED).map((c) => c.id);
    const forB = prepareMultiplayerDeck(deck, PLAYER_B, SEED).map((c) => c.id);
    expect(forA).not.toEqual(forB);
  });
});

describe("resolveMultiplayerCoinToss", () => {
  it("elige el mismo starterPlayerId en ambos clientes", () => {
    const fromClientA = resolveMultiplayerCoinToss({
      seed: SEED,
      canonicalPlayerAId: PLAYER_A,
      canonicalPlayerBId: PLAYER_B,
      localPlayerId: PLAYER_A,
    });
    const fromClientB = resolveMultiplayerCoinToss({
      seed: SEED,
      canonicalPlayerAId: PLAYER_A,
      canonicalPlayerBId: PLAYER_B,
      localPlayerId: PLAYER_B,
    });
    expect(fromClientA.starterPlayerId).toBe(fromClientB.starterPlayerId);
  });

  it("traduce el lado a la perspectiva local de cada cliente", () => {
    const fromClientA = resolveMultiplayerCoinToss({
      seed: SEED,
      canonicalPlayerAId: PLAYER_A,
      canonicalPlayerBId: PLAYER_B,
      localPlayerId: PLAYER_A,
    });
    const fromClientB = resolveMultiplayerCoinToss({
      seed: SEED,
      canonicalPlayerAId: PLAYER_A,
      canonicalPlayerBId: PLAYER_B,
      localPlayerId: PLAYER_B,
    });
    // El ganador ve "PLAYER", el otro ve "OPPONENT".
    expect(fromClientA.starterSide === "PLAYER" || fromClientB.starterSide === "PLAYER").toBe(true);
    expect(fromClientA.starterSide).not.toBe(fromClientB.starterSide);
  });
});

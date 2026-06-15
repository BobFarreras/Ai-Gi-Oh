// src/components/game/board/internal/player-hand/hand-props-equality.test.ts - Verifica los comparadores de igualdad por contenido de las manos.
import { describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { areEqualPlayerHandProps, areHandsEqual, areIdListsEqual } from "./hand-props-equality";
import type { PlayerHandProps } from "@/components/game/board/PlayerHand";

function createCard(id: string): ICard {
  return { id, runtimeId: id, name: id, description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 100, defense: 100 };
}

describe("areHandsEqual", () => {
  it("considera iguales manos con las mismas cartas aunque el array sea otra referencia", () => {
    const a = [createCard("c1"), createCard("c2")];
    const b = [createCard("c1"), createCard("c2")];
    expect(areHandsEqual(a, b)).toBe(true);
  });

  it("detecta cambios de composición de la mano", () => {
    expect(areHandsEqual([createCard("c1")], [createCard("c2")])).toBe(false);
    expect(areHandsEqual([createCard("c1")], [createCard("c1"), createCard("c2")])).toBe(false);
  });
});

describe("areIdListsEqual", () => {
  it("compara por contenido y tolera undefined", () => {
    expect(areIdListsEqual(undefined, undefined)).toBe(true);
    expect(areIdListsEqual(["a"], ["a"])).toBe(true);
    expect(areIdListsEqual(["a"], ["b"])).toBe(false);
  });
});

describe("areEqualPlayerHandProps", () => {
  const onCardClick = vi.fn();
  const onPlayAction = vi.fn();

  function baseProps(overrides: Partial<PlayerHandProps> = {}): PlayerHandProps {
    return {
      hand: [createCard("c1")],
      playingCard: null,
      hasSummoned: false,
      isPlayerTurn: true,
      highlightedCardIds: [],
      onCardClick,
      onPlayAction,
      ...overrides,
    };
  }

  it("es igual cuando nada relevante cambia (aunque la mano sea otra referencia)", () => {
    expect(areEqualPlayerHandProps(baseProps(), baseProps())).toBe(true);
  });

  it("no es igual si cambia el turno", () => {
    expect(areEqualPlayerHandProps(baseProps(), baseProps({ isPlayerTurn: false }))).toBe(false);
  });

  it("no es igual si cambia la carta en juego o si ya invocó", () => {
    expect(areEqualPlayerHandProps(baseProps(), baseProps({ playingCard: createCard("c1") }))).toBe(false);
    expect(areEqualPlayerHandProps(baseProps(), baseProps({ hasSummoned: true }))).toBe(false);
  });
});

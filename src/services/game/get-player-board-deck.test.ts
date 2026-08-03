// src/services/game/get-player-board-deck.test.ts - Verifica que los modos autoritativos cargan el deck del playerId validado.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlayerBoardLoadoutByPlayerId } from "./get-player-board-deck";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";

vi.mock("@/services/player-persistence/create-player-runtime-repositories", () => ({
  createPlayerRuntimeRepositories: vi.fn(),
}));

describe("getPlayerBoardLoadoutByPlayerId", () => {
  beforeEach(() => vi.clearAllMocks());

  it("consulta todos los repositorios con la identidad autenticada y conserva sus 20 cartas", async () => {
    const cards = Array.from({ length: 20 }, (_, index) => ({
      id: `owned-${index}`, name: `Propia ${index}`, description: "", type: "ENTITY" as const,
      faction: "NEUTRAL" as const, cost: 1, attack: 100, defense: 100,
    }));
    vi.mocked(createPlayerRuntimeRepositories).mockResolvedValue({
      deckRepository: {
        getDeck: vi.fn(async () => ({
          slots: cards.map((card, index) => ({ slotIndex: index, cardId: card.id })),
          fusionSlots: [],
        })),
        getCollection: vi.fn(async () => cards.map((card) => ({ card }))),
      },
      playerCardProgressRepository: { listByPlayer: vi.fn(async () => []) },
      playerCardUpgradesRepository: { getUpgradesByPlayer: vi.fn(async () => new Map()) },
    } as unknown as Awaited<ReturnType<typeof createPlayerRuntimeRepositories>>);

    const result = await getPlayerBoardLoadoutByPlayerId("player-authenticated");

    expect(result.deck?.map((card) => card.id)).toEqual(cards.map((card) => card.id));
    expect(vi.mocked(createPlayerRuntimeRepositories).mock.results).toHaveLength(1);
  });
});

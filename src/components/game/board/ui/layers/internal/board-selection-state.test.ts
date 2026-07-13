// src/components/game/board/ui/layers/internal/board-selection-state.test.ts - Verifica que la selección
// de tablero se resuelva por instanceId (único) y no confunda copias iguales en ambos campos.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { resolveBoardSelectionState } from "./board-selection-state";
import { IBoardInteractiveLayerProps } from "./board-interactive-types";

const kaClauli: ICard = {
  id: "fusion-kaclauli",
  name: "KaClauli",
  description: "Fusión",
  type: "FUSION",
  faction: "NEUTRAL",
  cost: 6,
  attack: 3000,
  defense: 2500,
};

function entity(instanceId: string, card: ICard, mode: IBoardEntity["mode"] = "ATTACK"): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}

function buildProps(overrides: Partial<IBoardInteractiveLayerProps>): IBoardInteractiveLayerProps {
  return {
    phase: "BATTLE",
    player: { id: "p1", hand: [], deck: [], graveyard: [], activeEntities: [], activeExecutions: [] },
    opponent: { id: "p2", hand: [], deck: [], graveyard: [], activeEntities: [], activeExecutions: [] },
    selectedCard: null,
    selectedBoardEntityInstanceId: null,
    playingCard: null,
    ...overrides,
  } as unknown as IBoardInteractiveLayerProps;
}

describe("resolveBoardSelectionState", () => {
  it("no confunde la misma fusión de ambos campos al seleccionar la propia (por instanceId)", () => {
    const props = buildProps({
      player: { id: "p1", hand: [], deck: [], graveyard: [], activeEntities: [entity("p-ka", kaClauli)], activeExecutions: [] } as never,
      opponent: { id: "p2", hand: [], deck: [], graveyard: [], activeEntities: [entity("o-ka", { ...kaClauli })], activeExecutions: [] } as never,
      selectedCard: kaClauli,
      selectedBoardEntityInstanceId: "p-ka",
    });

    const state = resolveBoardSelectionState(props);

    // La selección es del jugador, NO del rival: puede atacar (overlay propio oculto en batalla).
    expect(state.isOpponentBoardSelection).toBe(false);
    expect(state.overlaySource).toBe("BOARD");
    expect(state.shouldRenderMobileOverlay).toBe(false);
  });

  it("reconoce la selección del rival por su propio instanceId", () => {
    const props = buildProps({
      player: { id: "p1", hand: [], deck: [], graveyard: [], activeEntities: [entity("p-ka", kaClauli)], activeExecutions: [] } as never,
      opponent: { id: "p2", hand: [], deck: [], graveyard: [], activeEntities: [entity("o-ka", { ...kaClauli })], activeExecutions: [] } as never,
      selectedCard: kaClauli,
      selectedBoardEntityInstanceId: "o-ka",
    });

    const state = resolveBoardSelectionState(props);

    expect(state.isOpponentBoardSelection).toBe(true);
    expect(state.selectedOverlayCard?.id).toBe("fusion-kaclauli");
  });

  it("sin selección de tablero, sigue resolviendo por carta (compatibilidad)", () => {
    const props = buildProps({
      opponent: { id: "p2", hand: [], deck: [], graveyard: [], activeEntities: [entity("o-ka", kaClauli)], activeExecutions: [] } as never,
      selectedCard: kaClauli,
      selectedBoardEntityInstanceId: null,
      phase: "MAIN_1",
    });

    const state = resolveBoardSelectionState(props);

    expect(state.isOpponentBoardSelection).toBe(true);
    expect(state.selectedOverlayCard?.id).toBe("fusion-kaclauli");
  });
});

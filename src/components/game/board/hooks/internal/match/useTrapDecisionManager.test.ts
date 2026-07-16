// src/components/game/board/hooks/internal/match/useTrapDecisionManager.test.ts - Carrusel de decisión de
// trampa (ficha 4): la lista se expone en el prompt, ‹ › navega y "activar" resuelve con la elegida.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { ITrapActivationPrompt } from "../board-state/useBoardUiState";
import { useTrapDecisionManager } from "./useMatchRuntime.internal";

function trapCard(id: string): ICard {
  return { id, name: id, description: "", type: "TRAP", faction: "NEUTRAL", cost: 2, effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" } };
}

/** Simula el trozo de uiState que usa el manager, con un prompt "vivo" que el manager lee y muta. */
function createUiStateStub() {
  const store: { prompt: ITrapActivationPrompt | null; selectedCard: ICard | null } = { prompt: null, selectedCard: null };
  return {
    stub: {
      get pendingTrapActivationPrompt() {
        return store.prompt;
      },
      get selectedCard() {
        return store.selectedCard;
      },
      setSelectedCard: vi.fn((card: ICard | null) => {
        store.selectedCard = card;
      }),
      setPendingTrapActivationPrompt: vi.fn((prompt: ITrapActivationPrompt | null) => {
        store.prompt = prompt;
      }),
      clearSelection: vi.fn(() => {
        store.selectedCard = null;
      }),
    } as unknown as Parameters<typeof useTrapDecisionManager>[0]["uiState"],
    store,
  };
}

describe("useTrapDecisionManager (carrusel ficha 4)", () => {
  it("muestra la primera elegible y resuelve con la que se activa tras navegar", async () => {
    const { stub, store } = createUiStateStub();
    const { result } = renderHook(() => useTrapDecisionManager({ uiState: stub }));

    let decision: Promise<{ activate: boolean; chosenTrapInstanceId?: string }>;
    act(() => {
      decision = result.current.requestTrapActivationDecision(
        [
          { card: trapCard("trap-a"), instanceId: "t1" },
          { card: trapCard("trap-b"), instanceId: "t2" },
        ],
        "ON_OPPONENT_ATTACK_DECLARED",
      );
    });
    expect(store.prompt?.currentIndex).toBe(0);
    expect(store.selectedCard?.id).toBe("trap-a");

    // Avanza a la segunda trampa y la activa.
    act(() => result.current.cyclePendingTrap(1));
    expect(store.prompt?.currentIndex).toBe(1);
    expect(store.selectedCard?.id).toBe("trap-b");

    act(() => {
      // activatePendingTrap vive en los builders; aquí replicamos su cálculo: resolver con la mostrada.
      const chosen = store.prompt!.eligibleTraps[store.prompt!.currentIndex].instanceId;
      result.current.resolveTrapActivationDecision({ activate: true, chosenTrapInstanceId: chosen });
    });
    await expect(decision!).resolves.toEqual({ activate: true, chosenTrapInstanceId: "t2" });
    expect(store.prompt).toBeNull();
  });

  it("sin trampas elegibles resuelve 'pasar' sin abrir prompt", async () => {
    const { stub, store } = createUiStateStub();
    const { result } = renderHook(() => useTrapDecisionManager({ uiState: stub }));
    let decision: Promise<{ activate: boolean }>;
    act(() => {
      decision = result.current.requestTrapActivationDecision([], "ON_OPPONENT_ATTACK_DECLARED");
    });
    await expect(decision!).resolves.toEqual({ activate: false });
    expect(store.prompt).toBeNull();
  });
});

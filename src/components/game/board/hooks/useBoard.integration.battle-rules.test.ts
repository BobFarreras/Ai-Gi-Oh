// src/components/game/board/hooks/useBoard.integration.battle-rules.test.ts - Cubre reglas de combate críticas del hook useBoard.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { createMouseEvent, integrationEntityCard } from "@/components/game/board/hooks/useBoard.integration.helpers";

describe("useBoard integración battle-rules", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.setItem("board-turn-help", "0");
    window.localStorage.setItem("board-auto-phase", "1");
  });
  afterEach(() => vi.useRealTimers());

  it("bloquea ataque directo del jugador inicial durante primer turno", async () => {
    const forcedDeck: ICard[] = Array.from({ length: 20 }, (_, index) => ({
      ...integrationEntityCard,
      id: `${integrationEntityCard.id}-direct-${index}`,
      name: `${integrationEntityCard.name} Direct ${index + 1}`,
      runtimeId: `integration-direct-${index + 1}`,
    }));
    const { result } = renderHook(() => useBoard(forcedDeck));
    const entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    expect(entityCard).toBeDefined();
    if (!entityCard) throw new Error("No se encontró entidad en mano con deck forzado.");
    act(() => result.current.toggleCardSelection(entityCard, createMouseEvent()));
    await act(async () => { await result.current.executePlayAction("ATTACK", createMouseEvent()); });
    act(() => result.current.advancePhase());
    const attacker = result.current.gameState.playerA.activeEntities[0];
    expect(attacker).toBeDefined();
    await act(async () => { await result.current.handleEntityClick(attacker, false, createMouseEvent()); });
    await act(async () => { await result.current.handleEntityClick(null, true, createMouseEvent()); });
    expect(result.current.gameState.playerB.healthPoints).toBe(8000);
    expect(result.current.lastError?.code).toBe("GAME_RULE_ERROR");
    expect(result.current.lastError?.message).toContain("no puede atacar durante el primer turno");
    expect(result.current.activeAttackerId).toBeNull();
  });

  it("mantiene atacante seleccionado al pulsar dos veces la misma entidad en BATTLE", async () => {
    const forcedDeck: ICard[] = Array.from({ length: 20 }, (_, index) => ({
      ...integrationEntityCard,
      id: `${integrationEntityCard.id}-${index}`,
      name: `${integrationEntityCard.name} ${index + 1}`,
      runtimeId: `integration-entity-${index + 1}`,
    }));
    const { result } = renderHook(() => useBoard(forcedDeck));
    const entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    expect(entityCard).toBeDefined();
    if (!entityCard) throw new Error("Se requiere una entidad en mano.");
    act(() => result.current.toggleCardSelection(entityCard, createMouseEvent()));
    await act(async () => { await result.current.executePlayAction("ATTACK", createMouseEvent()); });
    act(() => result.current.advancePhase());
    const summoned = result.current.gameState.playerA.activeEntities[0];
    expect(summoned).toBeDefined();
    if (!summoned) throw new Error("La entidad invocada no está disponible.");
    await act(async () => { await result.current.handleEntityClick(summoned, false, createMouseEvent(2)); });
    expect(result.current.activeAttackerId).toBe(summoned.instanceId);
    await act(async () => { await result.current.handleEntityClick(summoned, false, createMouseEvent()); });
    const updated = result.current.gameState.playerA.activeEntities.find((entity) => entity.instanceId === summoned.instanceId);
    expect(updated?.mode).toBe("ATTACK");
    expect(result.current.activeAttackerId).toBe(summoned.instanceId);
  });

  it("pasa automáticamente al rival en BATTLE si no hay atacantes", async () => {
    const { result } = renderHook(() => useBoard());
    expect(result.current.gameState.phase).toBe("MAIN_1");
    act(() => result.current.advancePhase());
    expect(result.current.gameState.phase).toBe("BATTLE");
    await act(async () => { await vi.advanceTimersByTimeAsync(420); });
    expect(result.current.gameState.activePlayerId).toBe(result.current.gameState.playerB.id);
    expect(result.current.gameState.phase).toBe("MAIN_1");
  });
});

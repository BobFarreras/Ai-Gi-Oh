// src/core/use-cases/game-engine/actions/grant-extra-summon.integration.test.ts - Verifica #2 Núcleo de Datos:
// una magia que concede una invocación normal EXTRA este turno (permite invocar dos entities).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const dataCore: ICard = {
  id: "exec-data-core-double-summon", name: "Núcleo de Datos", description: "", type: "EXECUTION",
  faction: "NEUTRAL", cost: 3, effect: { action: "GRANT_EXTRA_SUMMON" },
};
const entity = (id: string): ICard => ({ id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1000, defense: 1000 });

describe("GRANT_EXTRA_SUMMON (Núcleo de Datos)", () => {
  it("permite invocar dos entities el mismo turno tras activar la magia", () => {
    let state = createTestGameState({
      phase: "MAIN_1", activePlayerId: "p1",
      playerA: { hand: [dataCore, entity("ent-1"), entity("ent-2"), entity("ent-3")], currentEnergy: 12, maxEnergy: 15 },
    });
    state = GameEngine.playCard(state, "p1", "exec-data-core-double-summon", "ACTIVATE");
    const execId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", execId);
    expect(state.extraSummonsThisTurn).toBe(1);

    // 1ª invocación: consume la normal, la extra sigue disponible.
    state = GameEngine.playCard(state, "p1", "ent-1", "ATTACK");
    expect(state.hasNormalSummonedThisTurn).toBe(true);
    expect(state.extraSummonsThisTurn).toBe(1);

    // 2ª invocación: permitida, consume la extra.
    state = GameEngine.playCard(state, "p1", "ent-2", "ATTACK");
    expect(state.playerA.activeEntities).toHaveLength(2);
    expect(state.extraSummonsThisTurn).toBe(0);

    // 3ª invocación: ya bloqueada.
    expect(() => GameEngine.playCard(state, "p1", "ent-3", "ATTACK")).toThrow(/invocado/i);
  });

  it("sin la magia, la segunda invocación está bloqueada", () => {
    let state = createTestGameState({
      phase: "MAIN_1", activePlayerId: "p1",
      playerA: { hand: [entity("ent-1"), entity("ent-2")], currentEnergy: 10, maxEnergy: 15 },
    });
    state = GameEngine.playCard(state, "p1", "ent-1", "ATTACK");
    expect(() => GameEngine.playCard(state, "p1", "ent-2", "ATTACK")).toThrow(/invocado/i);
  });

  it("las invocaciones extra se resetean al empezar un nuevo turno", () => {
    let state = createTestGameState({
      phase: "MAIN_1", activePlayerId: "p1", startingPlayerId: "p1",
      playerA: { hand: [dataCore], currentEnergy: 12, maxEnergy: 15 },
    });
    state = GameEngine.playCard(state, "p1", "exec-data-core-double-summon", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    expect(state.extraSummonsThisTurn).toBe(1);
    state = GameEngine.nextPhase(state); // MAIN_1 -> BATTLE
    state = GameEngine.nextPhase(state); // BATTLE -> turno de p2
    expect(state.extraSummonsThisTurn).toBe(0);
  });
});

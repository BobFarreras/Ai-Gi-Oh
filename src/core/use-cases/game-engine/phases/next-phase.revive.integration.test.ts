// src/core/use-cases/game-engine/phases/next-phase.revive.integration.test.ts - Verifica la pasiva
// innata "Reactivación" (Antigrabity): revive del cementerio al arrancar el turno de su dueño.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { REVIVE_NEXT_TURN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";
import { createDeckCard, createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const antigrabity: ICard = {
  id: "entity-antigrabity",
  name: "Antigrabity",
  description: "",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 3,
  attack: 1200,
  defense: 1200,
  masteryPassiveSkillId: REVIVE_NEXT_TURN_PASSIVE_ID,
};

describe("Reactivación (Antigrabity) en inicio de turno", () => {
  it("revive del cementerio al arrancar el turno de su dueño", () => {
    const state = createTestGameState({
      activePlayerId: "p2",
      phase: "BATTLE",
      turn: 4,
      playerA: { graveyard: [antigrabity], activeEntities: [] },
    });

    const next = GameEngine.nextPhase(state);

    expect(next.activePlayerId).toBe("p1");
    expect(next.playerA.activeEntities.map((entity) => entity.card.id)).toContain("entity-antigrabity");
    expect(next.playerA.graveyard.some((card) => card.id === "entity-antigrabity")).toBe(false);
    expect(next.combatLog.some((event) => event.eventType === "ENTITY_REVIVED")).toBe(true);
  });

  it("con el campo lleno (3 entities), sacrifica una para revivir", () => {
    const fillers = [1, 2, 3].map((n) => createTestBoardEntity(`f${n}`, createDeckCard(`entity-fill-${n}`), "ATTACK"));
    const state = createTestGameState({
      activePlayerId: "p2",
      phase: "BATTLE",
      playerA: { graveyard: [antigrabity], activeEntities: fillers },
    });

    const next = GameEngine.nextPhase(state);

    expect(next.playerA.activeEntities).toHaveLength(3);
    expect(next.playerA.activeEntities.map((entity) => entity.card.id)).toContain("entity-antigrabity");
    expect((next.playerA.destroyedPile ?? []).length).toBeGreaterThan(0);
    expect(next.combatLog.some((event) => event.eventType === "CARD_TO_DESTROYED")).toBe(true);
  });

  it("no revive si Antigrabity no está en el cementerio", () => {
    const state = createTestGameState({ activePlayerId: "p2", phase: "BATTLE", playerA: { graveyard: [], activeEntities: [] } });
    const next = GameEngine.nextPhase(state);
    expect(next.combatLog.some((event) => event.eventType === "ENTITY_REVIVED")).toBe(false);
  });
});

// src/core/use-cases/game-engine/phases/next-phase.mastery-turn-start.integration.test.ts - Verifica que nextPhase aplica crecimiento de ATK y curación al jugador que arranca turno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import {
  createTestBoardEntity,
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

function card(id: string, attack: number, passiveId: string): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense: 1000, versionTier: 5, masteryPassiveSkillId: passiveId };
}

// El turno pasa de p2 (activo en BATTLE) a p1, por lo que las pasivas de inicio de turno aplican a p1.
function stateStartingP1Turn(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      healthPoints: 7000,
      activeEntities: [
        createTestBoardEntity("g1", card("llm", 1000, MASTERY_PASSIVE_IDS.ATK_GROWTH), "ATTACK"),
        createTestBoardEntity("h1", card("db", 900, MASTERY_PASSIVE_IDS.HEAL_ON_TURN), "DEFENSE"),
      ],
    }),
    playerB: createTestPlayer("p2"),
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
  });
}

describe("next-phase: pasivas mastery de inicio de turno (integración)", () => {
  it("aplica +100 ATK (Aprendizaje) y +200 HP (Regeneración) al jugador que arranca turno", () => {
    const next = GameEngine.nextPhase(stateStartingP1Turn());
    expect(next.activePlayerId).toBe("p1");
    const grown = next.playerA.activeEntities.find((entity) => entity.instanceId === "g1");
    expect(grown?.card.attack).toBe(1100);
    expect(grown?.masteryAttackGrowth).toBe(100);
    expect(next.playerA.healthPoints).toBe(7200);
  });

  it("no aplica las pasivas al jugador que no arranca turno", () => {
    const next = GameEngine.nextPhase(stateStartingP1Turn());
    // p2 no tiene entities con pasiva; su HP sigue al máximo por defecto.
    expect(next.playerB.healthPoints).toBe(8000);
  });
});

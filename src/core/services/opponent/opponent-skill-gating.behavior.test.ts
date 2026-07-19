// src/core/services/opponent/opponent-skill-gating.behavior.test.ts - Ficha 5: el gating se observa en choosePlay.
// MASTER (skill baitReactiveTrap) retrasa invocar para cebar la Flutter Enjambre; EASY no lo entiende e invoca.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { ICard } from "@/core/entities/ICard";

const flutter: ICard = { id: "trap-flutter-reflect", name: "Flutter Enjambre", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", effect: { action: "REFLECT_DIRECT_DAMAGE" } };
const rivalAttacker: ICard = { id: "p1-atk", name: "Rival", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 3, attack: 1500, defense: 1000 };

function baitScenario(): GameState {
  const base = createBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, activeEntities: [createBoardEntity("p1-atk-i", rivalAttacker, "ATTACK")] },
    // El bot tiene la Flutter armada y el tablero vacío; en mano solo su entity (bot-entity 2200/1200).
    playerB: { ...base.playerB, activeEntities: [], activeExecutions: [{ instanceId: "t-flutter", card: flutter, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false }] },
  };
}

describe("gating de cebo de trampa en choosePlay (ficha 5)", () => {
  it("MASTER retiene la invocación para cebar la Flutter (no juega nada)", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "MASTER" });
    expect(strategy.choosePlay(baitScenario(), "p2")).toBeNull();
  });

  it("EASY no entiende el cebo e invoca su entity igualmente", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });
    const decision = strategy.choosePlay(baitScenario(), "p2");
    expect(decision?.cardId).toBe("bot-entity");
  });
});

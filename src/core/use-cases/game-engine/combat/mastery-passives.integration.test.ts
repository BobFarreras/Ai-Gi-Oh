// src/core/use-cases/game-engine/combat/mastery-passives.integration.test.ts - Verifica activación de pasivas mastery V5 durante combate.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import {
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

function createEntity(instanceId: string, card: ICard, mode: "ATTACK" | "DEFENSE" | "SET"): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}

function createBaseState(attackerCard: ICard, defenderCard: ICard): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", { name: "A", activeEntities: [createEntity("a1", attackerCard, "ATTACK")] }),
    playerB: createTestPlayer("p2", { name: "B", activeEntities: [createEntity("d1", defenderCard, "ATTACK")] }),
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
  });
}

describe("mastery passives en combate", () => {
  it("aplica +200 daño directo en passive-direct-hit-plus-200", () => {
    const attackerCard: ICard = { id: "atk", name: "Atk", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 1500, defense: 1200, versionTier: 5, masteryPassiveSkillId: "passive-direct-hit-plus-200" };
    const defenderCard: ICard = { id: "def", name: "Def", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 1, attack: 800, defense: 800 };
    const state = createBaseState(attackerCard, defenderCard);
    const stateDirect = { ...state, playerB: { ...state.playerB, activeEntities: [] } };
    const next = GameEngine.executeAttack(stateDirect, "p1", "a1");
    expect(next.playerB.healthPoints).toBe(6300);
  });

  it("aplica -200 ATK al atacante en passive-atk-drain-200", () => {
    const attackerCard: ICard = { id: "atk", name: "Atk", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 1500, defense: 1200 };
    const defenderCard: ICard = { id: "def", name: "Def", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 1, attack: 1400, defense: 1000, versionTier: 5, masteryPassiveSkillId: "passive-atk-drain-200" };
    const state = createBaseState(attackerCard, defenderCard);
    const next = GameEngine.executeAttack(state, "p1", "a1", "d1");
    expect(next.playerA.healthPoints).toBe(7900);
  });

  it("aplica -200 ATK al atacante también cuando el defensor está en DEFENSE", () => {
    const attackerCard: ICard = { id: "atk", name: "Atk", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 1400, defense: 1200 };
    const defenderCard: ICard = { id: "def", name: "Def", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 1, attack: 900, defense: 1300, versionTier: 5, masteryPassiveSkillId: "passive-atk-drain-200" };
    const state = {
      ...createBaseState(attackerCard, defenderCard),
      playerB: { ...createBaseState(attackerCard, defenderCard).playerB, activeEntities: [createEntity("d1", defenderCard, "DEFENSE")] },
    };
    const next = GameEngine.executeAttack(state, "p1", "a1", "d1");
    expect(next.playerA.healthPoints).toBe(7900);
  });

  it("deja el ATK reducido en la entidad atacante si sobrevive al combate", () => {
    const attackerCard: ICard = { id: "atk", name: "Atk", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 2000, defense: 1200 };
    const defenderCard: ICard = { id: "def", name: "Def", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 1, attack: 1500, defense: 1000, versionTier: 5, masteryPassiveSkillId: "passive-atk-drain-200" };
    const state = createBaseState(attackerCard, defenderCard);
    const next = GameEngine.executeAttack(state, "p1", "a1", "d1");
    expect(next.playerA.activeEntities[0]?.card.attack).toBe(1800);
  });
});

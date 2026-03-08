// src/core/use-cases/game-engine/combat/destroyed-zone.integration.test.ts - Verifica diferencias entre cementerio y zona destruida en resolución de combate.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

function createEntity(instanceId: string, card: ICard): IBoardEntity {
  return { instanceId, card, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false };
}

function createState(attackerCard: ICard, defenderCard: ICard): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      destroyedPile: [],
      activeEntities: [createEntity("attacker", attackerCard)],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Smith",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      destroyedPile: [],
      activeEntities: [createEntity("defender", defenderCard)],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("destroyed zone en combate", () => {
  it("mantiene ruta a cementerio en combate normal", () => {
    const attacker: ICard = { id: "a-normal", name: "A", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1800, defense: 1000 };
    const defender: ICard = { id: "d-normal", name: "D", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1200, defense: 900 };
    const next = GameEngine.executeAttack(createState(attacker, defender), "p1", "attacker", "defender");
    expect(next.playerB.graveyard.some((card) => card.id === "d-normal")).toBe(true);
    expect((next.playerB.destroyedPile ?? []).some((card) => card.id === "d-normal")).toBe(false);
  });

  it("envía al destroyedPile cuando atacante gana con efecto de destrucción", () => {
    const attacker: ICard = {
      id: "a-destroy",
      name: "Destroyer",
      description: "",
      type: "ENTITY",
      faction: "NEUTRAL",
      cost: 3,
      attack: 2100,
      defense: 1200,
      effect: { action: "DESTROY_ENTITY_ON_BATTLE_WIN" },
    };
    const defender: ICard = { id: "d-destroy", name: "Target", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1200, defense: 900 };
    const next = GameEngine.executeAttack(createState(attacker, defender), "p1", "attacker", "defender");
    expect((next.playerB.destroyedPile ?? []).some((card) => card.id === "d-destroy")).toBe(true);
    expect(next.playerB.graveyard.some((card) => card.id === "d-destroy")).toBe(false);
    expect(next.combatLog.some((event) => event.eventType === "CARD_TO_DESTROYED")).toBe(true);
  });
});

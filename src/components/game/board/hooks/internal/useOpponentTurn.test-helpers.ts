// src/components/game/board/hooks/internal/useOpponentTurn.test-helpers.ts - Builders compartidos para escenarios de test de useOpponentTurn.
import { GameState } from "@/core/use-cases/GameEngine";

export function createBattleState(): GameState {
  return {
    playerA: { id: "p1", name: "Player", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 5, maxEnergy: 10, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] },
    playerB: {
      id: "p2",
      name: "Bot",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [{
        instanceId: "bot-attacker",
        card: { id: "bot-attacker-card", name: "Bot", description: "Atacante", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1600, defense: 900 },
        mode: "ATTACK",
        hasAttackedThisTurn: false,
        isNewlySummoned: false,
      }],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
    combatLog: [],
  };
}

// src/core/use-cases/game-engine/combat/mastery-passives-extended.integration.test.ts - Verifica las pasivas mastery V5 nuevas (Sobrecarga, Cortafuegos, Autoguardado, Caja de Herramientas).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

function entityCard(id: string, attack: number, defense: number, passiveId?: string): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense, versionTier: 5, masteryPassiveSkillId: passiveId ?? null };
}

function createEntity(instanceId: string, card: ICard, mode: BattleMode): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}

function battleState(attacker: IBoardEntity, defender: IBoardEntity, defenderOverrides?: Partial<IPlayer>): GameState {
  return createTestGameState({
    playerA: { name: "A", activeEntities: [attacker] },
    playerB: { name: "B", activeEntities: [defender], ...defenderOverrides },
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
  });
}

describe("mastery passives V5 nuevas", () => {
  it("Sobrecarga: +300 ATK al atacar a una entity rival", () => {
    const attacker = createEntity("a1", entityCard("atk", 1000, 1000, MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 800, 800), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    // 1300 (1000+300) - 800 = 500 de daño al jugador defensor.
    expect(next.playerB.healthPoints).toBe(7500);
  });

  it("Cortafuegos Reactivo: el defensor refleja 200 de daño al atacante", () => {
    const attacker = createEntity("a1", entityCard("atk", 2000, 1000), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 0, 500, MASTERY_PASSIVE_IDS.REFLECT_DAMAGE), "DEFENSE");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    // Rompe el muro (sin daño penetrante) pero recibe 200 reflejados.
    expect(next.playerA.healthPoints).toBe(7800);
    expect(next.playerB.activeEntities).toHaveLength(0);
  });

  it("Autoguardado: la entity destruida devuelve 1 energía a su dueño", () => {
    const attacker = createEntity("a1", entityCard("atk", 1000, 1000), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 500, 500, MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender, { currentEnergy: 5 }), "p1", "a1", "d1");
    expect(next.playerB.currentEnergy).toBe(6);
  });

  it("Autoguardado: no supera la energía máxima del jugador", () => {
    const attacker = createEntity("a1", entityCard("atk", 1000, 1000), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 500, 500, MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender, { currentEnergy: 10 }), "p1", "a1", "d1");
    expect(next.playerB.currentEnergy).toBe(10);
  });

  it("Caja de Herramientas: robar 1 carta al invocar la entity", () => {
    const boxCard = entityCard("box", 1000, 1000, MASTERY_PASSIVE_IDS.DRAW_ON_SUMMON);
    const drawnCard = entityCard("drawn", 900, 900);
    const state = createTestGameState({
      playerA: createTestPlayer("p1", { hand: [boxCard], deck: [drawnCard] }),
      activePlayerId: "p1",
      startingPlayerId: "p1",
      phase: "MAIN_1",
    });
    const next = GameEngine.playCard(state, "p1", "box", "ATTACK");
    expect(next.playerA.hand).toHaveLength(1);
    expect(next.playerA.hand[0]?.id).toBe("drawn");
    expect(next.playerA.deck).toHaveLength(0);
  });
});

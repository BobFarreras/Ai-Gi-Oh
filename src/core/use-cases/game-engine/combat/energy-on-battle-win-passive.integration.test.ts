// src/core/use-cases/game-engine/combat/energy-on-battle-win-passive.integration.test.ts - Pasiva innata
// "Sobrecarga Energética" (ficha 1 v1.17): al ganar un combate a otra entity, +1 energía al dueño en su
// SIGUIENTE turno. El motor cuenta en el GameState y concede al inicio del turno (motor puro, sin servidor).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ENERGY_ON_BATTLE_WIN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";
import { createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

function entityCard(id: string, attack: number, defense: number, passiveId?: string): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense, versionTier: 0, masteryPassiveSkillId: passiveId ?? null };
}

function createEntity(instanceId: string, card: ICard, mode: BattleMode): IBoardEntity {
  return { instanceId, card, mode, hasAttackedThisTurn: false, isNewlySummoned: false };
}

function battleState(attacker: IBoardEntity, defender: IBoardEntity): GameState {
  return createTestGameState({
    playerA: { name: "A", activeEntities: [attacker] },
    playerB: { name: "B", activeEntities: [defender] },
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
  });
}

describe("pasiva Sobrecarga Energética (energía por combate ganado)", () => {
  it("al ganar un combate, apunta +1 energía pendiente al dueño (no la da en el acto)", () => {
    const attacker = createEntity("a1", entityCard("windows92", 1500, 300, ENERGY_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 800, 800), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.playerB.activeEntities).toHaveLength(0);
    expect(next.pendingEnergyBonusByPlayerId?.p1).toBe(1);
  });

  it("a V5 la pasiva escala: cada combate ganado apunta +2 (magnitud plena)", () => {
    const v5Card = { ...entityCard("windows92", 1500, 300, ENERGY_ON_BATTLE_WIN_PASSIVE_ID), versionTier: 5 };
    const attacker = createEntity("a1", v5Card, "ATTACK");
    const defender = createEntity("d1", entityCard("def", 800, 800), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.pendingEnergyBonusByPlayerId?.p1).toBe(2);
  });

  it("un intercambio o una derrota no apuntan energía", () => {
    const attacker = createEntity("a1", entityCard("condensador", 1000, 1000, ENERGY_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 1000, 1000), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.pendingEnergyBonusByPlayerId?.p1 ?? 0).toBe(0);
  });

  it("la energía pendiente se concede al INICIO del siguiente turno del dueño y se limpia", () => {
    // p1 está en BATTLE con energía pendiente de p2; al pasar de fase, arranca el turno de p2 y la cobra.
    const state = createTestGameState({
      activePlayerId: "p1",
      phase: "BATTLE",
      playerB: { currentEnergy: 3 },
      pendingEnergyBonusByPlayerId: { p2: 1 },
    });
    const next = GameEngine.nextPhase(state);
    expect(next.activePlayerId).toBe("p2");
    // +2 rutinario del turno + 1 de la pasiva.
    expect(next.playerB.currentEnergy).toBe(6);
    expect(next.pendingEnergyBonusByPlayerId?.p2).toBe(0);
  });

  it("la energía pendiente respeta el máximo del jugador", () => {
    const state = createTestGameState({
      activePlayerId: "p1",
      phase: "BATTLE",
      playerB: { currentEnergy: 9, maxEnergy: 10 },
      pendingEnergyBonusByPlayerId: { p2: 1 },
    });
    const next = GameEngine.nextPhase(state);
    expect(next.playerB.currentEnergy).toBe(10);
  });
});

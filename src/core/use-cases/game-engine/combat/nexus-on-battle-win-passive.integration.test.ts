// src/core/use-cases/game-engine/combat/nexus-on-battle-win-passive.integration.test.ts - Pasiva innata
// "Recaudación" (ficha 3 v1.17): cuenta Nexus en el GameState cuando la entity gana un combate a otra entity.
// El motor SOLO cuenta; la acreditación (con topes) es del servidor al cerrar el duelo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { NEXUS_ON_BATTLE_WIN_PASSIVE_ID } from "@/core/services/progression/mastery-passive-ids";
import { createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

function entityCard(id: string, attack: number, defense: number, passiveId?: string): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense, versionTier: 0, masteryPassiveSkillId: passiveId ?? null };
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

describe("pasiva Recaudación (Nexus por combate ganado)", () => {
  it("el atacante con la pasiva que destruye a la entity rival y sobrevive suma 200 Nexus a su dueño", () => {
    const attacker = createEntity("a1", entityCard("recaudador", 1500, 300, NEXUS_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 800, 800), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.playerB.activeEntities).toHaveLength(0); // destruida
    expect(next.nexusEarnedByPlayerId?.p1).toBe(200);
    expect(next.nexusEarnedByPlayerId?.p2 ?? 0).toBe(0);
  });

  it("el defensor con la pasiva que destruye al atacante y sobrevive suma 200 a su dueño", () => {
    const attacker = createEntity("a1", entityCard("atk", 500, 500), "ATTACK");
    const defender = createEntity("d1", entityCard("recaudador", 1500, 1500, NEXUS_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.playerA.activeEntities).toHaveLength(0); // atacante destruido
    expect(next.nexusEarnedByPlayerId?.p2).toBe(200);
  });

  it("un intercambio (ambas destruidas) NO cuenta como victoria", () => {
    const attacker = createEntity("a1", entityCard("recaudador", 1000, 1000, NEXUS_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 1000, 1000), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.nexusEarnedByPlayerId?.p1 ?? 0).toBe(0);
  });

  it("si la entity con la pasiva pierde el combate, no suma nada", () => {
    const attacker = createEntity("a1", entityCard("recaudador", 400, 400, NEXUS_ON_BATTLE_WIN_PASSIVE_ID), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 1500, 1500), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.playerA.activeEntities).toHaveLength(0); // el recaudador cae
    expect(next.nexusEarnedByPlayerId?.p1 ?? 0).toBe(0);
  });

  it("una entity sin la pasiva no suma Nexus aunque gane", () => {
    const attacker = createEntity("a1", entityCard("normal", 1500, 300), "ATTACK");
    const defender = createEntity("d1", entityCard("def", 800, 800), "ATTACK");
    const next = GameEngine.executeAttack(battleState(attacker, defender), "p1", "a1", "d1");
    expect(next.playerB.activeEntities).toHaveLength(0);
    expect(next.nexusEarnedByPlayerId?.p1 ?? 0).toBe(0);
  });
});

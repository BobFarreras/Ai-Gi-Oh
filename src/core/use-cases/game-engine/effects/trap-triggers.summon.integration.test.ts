// src/core/use-cases/game-engine/effects/trap-triggers.summon.integration.test.ts - Prueba trigger de trampa al invocar entidad en SET y bloqueo forzado en ATTACK.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTrapBaseState, createTrapEntity, trapForceDefenseSummonToAttackLock } from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

describe("Trap triggers on summon", () => {
  it("debería forzar ATTACK y bloquear modo al invocar entidad rival en defensa", () => {
    const summonCard = {
      id: "entity-set-target",
      name: "Set Target",
      description: "",
      type: "ENTITY" as const,
      faction: "OPEN_SOURCE" as const,
      cost: 1,
      attack: 900,
      defense: 1800,
    };
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      phase: "MAIN_1",
      playerA: {
        ...base.playerA,
        hand: [summonCard],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t-summon-lock", trapForceDefenseSummonToAttackLock)],
      },
    };
    const next = GameEngine.playCard(state, "p1", "entity-set-target", "DEFENSE");
    const summoned = next.playerA.activeEntities[0];
    expect(summoned.mode).toBe("ATTACK");
    expect(summoned.modeLock).toBe("ATTACK");
  });
});

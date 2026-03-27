// src/core/use-cases/game-engine/effects/internal/trap-effect-registry.test.ts - Verifica acciones registradas y fallback seguro del registry de efectos TRAP.
import { describe, expect, it } from "vitest";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getRegisteredTrapActions, resolveTrapEffectFromRegistry } from "@/core/use-cases/game-engine/effects/internal/trap-effect-registry";

function createPlayer(id: string): IPlayer {
  return { id, name: id, healthPoints: 4000, maxHealthPoints: 4000, currentEnergy: 2, maxEnergy: 5, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] };
}

function createTrapWithoutEffect(): IBoardEntity {
  return { instanceId: "trap-1", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-1", name: "Trap", description: "Trap", type: "TRAP", faction: "OPEN_SOURCE", cost: 1, trigger: "ON_OPPONENT_ATTACK_DECLARED" } };
}

describe("trap-effect-registry", () => {
  it("expone el set esperado de acciones registradas", () => {
    expect(getRegisteredTrapActions()).toEqual([
      "DAMAGE",
      "REDUCE_OPPONENT_ATTACK",
      "REDUCE_OPPONENT_DEFENSE",
      "NEGATE_ATTACK_AND_DESTROY_ATTACKER",
    ]);
  });

  it("retorna estado neutro cuando la trampa no tiene efecto", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    const result = resolveTrapEffectFromRegistry(player, opponent, createTrapWithoutEffect());
    expect(result?.player.id).toBe("a");
    expect(result?.opponent.id).toBe("b");
    expect(result?.damage).toBe(0);
  });
});

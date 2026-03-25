// src/core/use-cases/game-engine/actions/internal/execution-effect-registry.test.ts - Verifica acciones registradas y fallback seguro del registry de efectos EXECUTION.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { getRegisteredExecutionActions, resolveExecutionEffectFromRegistry } from "@/core/use-cases/game-engine/actions/internal/execution-effect-registry";

function createPlayer(id: string): IPlayer {
  return { id, name: id, healthPoints: 4000, maxHealthPoints: 4000, currentEnergy: 2, maxEnergy: 5, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] };
}

describe("execution-effect-registry", () => {
  it("expone el set esperado de acciones registradas", () => {
    expect(getRegisteredExecutionActions()).toEqual([
      "DAMAGE",
      "HEAL",
      "DRAW_CARD",
      "RESTORE_ENERGY",
      "BOOST_ATTACK_ALLIED_ENTITY",
      "BOOST_DEFENSE_BY_ARCHETYPE",
      "BOOST_ATTACK_BY_ARCHETYPE",
    ]);
  });

  it("devuelve null para acciones delegadas fuera del registry", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    const fusionEffect = { action: "FUSION_SUMMON", recipeId: "r1", materialsRequired: 2 } as ICard["effect"];
    expect(resolveExecutionEffectFromRegistry(player, opponent, fusionEffect!)).toBeNull();
  });
});

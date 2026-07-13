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
      "COPY_OPPONENT_BUFF_TO_ALLIED_ENTITIES",
      "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED",
      "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN",
      "APPLY_DAMAGE_OVER_TIME",
      "APPLY_HEAL_OVER_TIME",
      "REFLECT_DIRECT_DAMAGE",
    ]);
  });

  it("REFLECT_DIRECT_DAMAGE refleja el ATK del atacante y marca la anulación del golpe directo", () => {
    const attackerCard = { id: "atk", name: "Atk", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 3, attack: 1600, defense: 1000 };
    const opponent = { ...createPlayer("b"), activeEntities: [{ instanceId: "atk-inst", card: attackerCard, mode: "ATTACK" as const, hasAttackedThisTurn: false, isNewlySummoned: false }] };
    const trap: IBoardEntity = { instanceId: "t-reflect", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-flutter-reflect", name: "Flutter", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", effect: { action: "REFLECT_DIRECT_DAMAGE" } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), opponent, trap, { attackerPlayerId: "b", attackerInstanceId: "atk-inst" });
    expect(result?.negatesDirectAttack).toBe(true);
    expect(result?.damage).toBe(1600);
    expect(result?.opponent.healthPoints).toBe(4000 - 1600);
    expect(result?.player.healthPoints).toBe(4000); // el dueño no recibe daño
  });

  it("APPLY_DAMAGE_OVER_TIME infecta al rival (opponent) con daño por turno indefinido", () => {
    const trap: IBoardEntity = { instanceId: "t-dot", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-windows", name: "Windows", description: "", type: "TRAP", faction: "BIG_TECH", cost: 2, trigger: "ON_OPPONENT_TRAP_ACTIVATED", effect: { action: "APPLY_DAMAGE_OVER_TIME", value: 300 } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), createPlayer("b"), trap);
    expect(result?.addedStatusEffects).toEqual([{ kind: "DAMAGE_OVER_TIME", targetPlayerId: "b", remainingTurns: null, magnitude: 300 }]);
  });

  it("APPLY_HEAL_OVER_TIME cura al dueño (player) por turno indefinido", () => {
    const trap: IBoardEntity = { instanceId: "t-hot", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-hugging", name: "Hugging", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_TRAP_ACTIVATED", effect: { action: "APPLY_HEAL_OVER_TIME", value: 300 } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), createPlayer("b"), trap);
    expect(result?.addedStatusEffects).toEqual([{ kind: "HEAL_OVER_TIME", targetPlayerId: "a", remainingTurns: null, magnitude: 300 }]);
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

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
      "REINFORCE_LINKED_ENTITY_ON_ATTACK",
      "NEGATE_ATTACK",
      "NEGATE_OPPONENT_EXECUTION_AND_DESTROY",
      "NULLIFY_OPPONENT_BUFF",
    ]);
  });

  it("REINFORCE_LINKED_ENTITY_ON_ATTACK refuerza TODAS tus entities ligadas, persiste y acumula", () => {
    const tsCard = (defense: number) => ({ id: "entity-typescript", name: "TS", description: "", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 4, attack: 1200, defense });
    const otherCard = { id: "entity-otra", name: "O", description: "", type: "ENTITY" as const, faction: "NEUTRAL" as const, cost: 2, attack: 800, defense: 700 };
    const player = { ...createPlayer("a"), activeEntities: [
      { instanceId: "ts1", card: tsCard(1000), mode: "DEFENSE" as const, hasAttackedThisTurn: false, isNewlySummoned: false },
      { instanceId: "ts2", card: tsCard(1500), mode: "ATTACK" as const, hasAttackedThisTurn: false, isNewlySummoned: false },
      { instanceId: "o", card: otherCard, mode: "DEFENSE" as const, hasAttackedThisTurn: false, isNewlySummoned: false },
    ] };
    const trap: IBoardEntity = { instanceId: "t-shield", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-typescript-shield", name: "Shield", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "REINFORCE_LINKED_ENTITY_ON_ATTACK", linkedCardId: "entity-typescript", value: 1000 } } };
    const first = resolveTrapEffectFromRegistry(player, createPlayer("b"), trap, { attackerPlayerId: "b", attackerInstanceId: "x", defenderInstanceId: "ts1" })!;
    expect(first.keepTrapSet).toBe(true);
    // Ambas TypeScript suben +1000; la entity no-ligada no cambia.
    expect(first.player.activeEntities.find((e) => e.instanceId === "ts1")?.card.defense).toBe(2000);
    expect(first.player.activeEntities.find((e) => e.instanceId === "ts2")?.card.defense).toBe(2500);
    expect(first.player.activeEntities.find((e) => e.instanceId === "o")?.card.defense).toBe(700);
    expect(first.buffTargetEntityIds).toEqual(["ts1", "ts2"]);
    // Acumula sobre el resultado anterior.
    const second = resolveTrapEffectFromRegistry(first.player, createPlayer("b"), trap, { attackerPlayerId: "b", attackerInstanceId: "x", defenderInstanceId: "ts1" })!;
    expect(second.player.activeEntities.find((e) => e.instanceId === "ts1")?.card.defense).toBe(3000);
  });

  it("NEGATE_OPPONENT_EXECUTION_AND_DESTROY destruye la ejecución activada y marca la anulación", () => {
    const execCard = { id: "exec-x", name: "X", description: "", type: "EXECUTION" as const, faction: "NEUTRAL" as const, cost: 2, effect: { action: "DAMAGE" as const, target: "OPPONENT" as const, value: 500 } };
    const opponent = { ...createPlayer("b"), activeExecutions: [{ instanceId: "exec-inst", card: execCard, mode: "ACTIVATE" as const, hasAttackedThisTurn: false, isNewlySummoned: false }] };
    const trap: IBoardEntity = { instanceId: "t-fw", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-firewall-counter-magic", name: "FW", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_EXECUTION_ACTIVATED", effect: { action: "NEGATE_OPPONENT_EXECUTION_AND_DESTROY" } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), opponent, trap, { activatedExecutionInstanceId: "exec-inst" });
    expect(result?.negatesExecution).toBe(true);
    expect(result?.opponent.activeExecutions).toHaveLength(0);
    expect((result?.opponent.destroyedPile ?? []).some((card) => card.id === "exec-x")).toBe(true);
    expect(result?.destroyedOpponentEntityFrom).toBe("EXECUTION_ZONE");
  });

  it("NULLIFY_OPPONENT_BUFF anula el buff y penaliza por debajo (resta el doble del buff)", () => {
    // La entity ya viene buffeada (+500): base 1000, buffeada 1500. OpenClaw resta 2*500 = 1000 -> 500.
    const buffedCard = { id: "ent", name: "Ent", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 3, attack: 1500, defense: 1000 };
    const opponent = { ...createPlayer("b"), activeEntities: [{ instanceId: "e1", card: buffedCard, mode: "ATTACK" as const, hasAttackedThisTurn: false, isNewlySummoned: false }] };
    const trap: IBoardEntity = { instanceId: "t-oc", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-openclaw-nullify-buff", name: "OC", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_STAT_BUFF_APPLIED", effect: { action: "NULLIFY_OPPONENT_BUFF" } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), opponent, trap, { buffSourcePlayerId: "b", buffStat: "ATTACK", buffAmount: 500, buffTargetEntityIds: ["e1"] });
    expect(result?.opponent.activeEntities[0].card.attack).toBe(500); // 1500 - 2*500
    expect(result?.buffAmount).toBe(-1000);
  });

  it("NEGATE_ATTACK marca la anulación del ataque sin tocar LP ni destruir al atacante", () => {
    const attackerCard = { id: "atk", name: "Atk", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 3, attack: 1600, defense: 1000 };
    const opponent = { ...createPlayer("b"), activeEntities: [{ instanceId: "atk-inst", card: attackerCard, mode: "ATTACK" as const, hasAttackedThisTurn: false, isNewlySummoned: false }] };
    const trap: IBoardEntity = { instanceId: "t-meta", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-escudo-metasploit", name: "Meta", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 2, trigger: "ON_OPPONENT_ATTACK_DECLARED", effect: { action: "NEGATE_ATTACK" } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), opponent, trap, { attackerPlayerId: "b", attackerInstanceId: "atk-inst" });
    expect(result?.negatesAttack).toBe(true);
    expect(result?.damage).toBe(0);
    expect(result?.opponent.activeEntities).toHaveLength(1); // no destruye al atacante
  });

  it("REFLECT_DIRECT_DAMAGE refleja el ATK del atacante y marca la anulación del golpe directo", () => {
    const attackerCard = { id: "atk", name: "Atk", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 3, attack: 1600, defense: 1000 };
    const opponent = { ...createPlayer("b"), activeEntities: [{ instanceId: "atk-inst", card: attackerCard, mode: "ATTACK" as const, hasAttackedThisTurn: false, isNewlySummoned: false }] };
    const trap: IBoardEntity = { instanceId: "t-reflect", mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false, card: { id: "trap-flutter-reflect", name: "Flutter", description: "", type: "TRAP", faction: "OPEN_SOURCE", cost: 3, trigger: "ON_OPPONENT_DIRECT_ATTACK_DECLARED", effect: { action: "REFLECT_DIRECT_DAMAGE" } } };
    const result = resolveTrapEffectFromRegistry(createPlayer("a"), opponent, trap, { attackerPlayerId: "b", attackerInstanceId: "atk-inst" });
    expect(result?.negatesAttack).toBe(true);
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

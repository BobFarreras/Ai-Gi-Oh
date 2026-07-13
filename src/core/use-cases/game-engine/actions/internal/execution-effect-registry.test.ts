// src/core/use-cases/game-engine/actions/internal/execution-effect-registry.test.ts - Verifica acciones registradas y fallback seguro del registry de efectos EXECUTION.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { getRegisteredExecutionActions, resolveExecutionEffectFromRegistry } from "@/core/use-cases/game-engine/actions/internal/execution-effect-registry";

function createPlayer(id: string): IPlayer {
  return { id, name: id, healthPoints: 4000, maxHealthPoints: 4000, currentEnergy: 2, maxEnergy: 5, deck: [], hand: [], graveyard: [], activeEntities: [], activeExecutions: [] };
}

function entityCard(id: string, attack: number): ICard {
  return { id, name: id, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense: 0 };
}
function trapCard(id: string): ICard {
  return { id, name: id, description: "", type: "TRAP", faction: "NEUTRAL", cost: 1 };
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
      "SET_DEFENSE_BY_CARD_ID",
      "BOOST_DEFENSE_BY_CARD_ID",
      "BOOST_ATTACK_BY_CARD_ID",
      "DAMAGE_IF_ALLY_ON_BOARD",
      "APPLY_NO_DIRECT_ATTACKS",
      "DRAIN_OPPONENT_ENERGY",
      "SET_CARD_DUEL_PROGRESS",
      "REDUCE_OPPONENT_ATTACK",
      "DESTROY_ALL_TRAPS",
      "DISCARD_OPPONENT_HAND_CARD",
      "GRANT_EXTRA_SUMMON",
    ]);
  });

  it("GRANT_EXTRA_SUMMON concede invocaciones extra (mínimo 1)", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    expect(resolveExecutionEffectFromRegistry(player, opponent, { action: "GRANT_EXTRA_SUMMON" })?.grantedExtraSummons).toBe(1);
    expect(resolveExecutionEffectFromRegistry(player, opponent, { action: "GRANT_EXTRA_SUMMON", count: 2 })?.grantedExtraSummons).toBe(2);
  });

  it("devuelve null para acciones delegadas fuera del registry", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    const fusionEffect = { action: "FUSION_SUMMON", recipeId: "r1", materialsRequired: 2 } as ICard["effect"];
    expect(resolveExecutionEffectFromRegistry(player, opponent, fusionEffect!)).toBeNull();
  });

  it("REDUCE_OPPONENT_ATTACK baja el ataque de todas las entities rivales (mínimo 0)", () => {
    const player = createPlayer("a");
    const opponent: IPlayer = {
      ...createPlayer("b"),
      activeEntities: [
        { instanceId: "e1", card: entityCard("c1", 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
        { instanceId: "e2", card: entityCard("c2", 500), mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false },
      ],
    };
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "REDUCE_OPPONENT_ATTACK", value: 700 })!;
    expect(result.opponent.activeEntities.map((e) => e.card.attack)).toEqual([300, 0]);
    expect(result.buff).toEqual({ entityIds: ["e1", "e2"], stat: "ATTACK", amount: -700 });
  });

  it("BOOST_ATTACK_BY_CARD_ID solo sube el ATK de las entities propias con ese card id", () => {
    const player: IPlayer = {
      ...createPlayer("a"),
      activeEntities: [
        { instanceId: "e1", card: entityCard("entity-figma", 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
        { instanceId: "e2", card: entityCard("entity-otra", 900), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
      ],
    };
    const opponent = createPlayer("b");
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "BOOST_ATTACK_BY_CARD_ID", targetCardId: "entity-figma", value: 1000 })!;
    expect(result.player.activeEntities.map((e) => e.card.attack)).toEqual([2000, 900]);
    expect(result.buff).toEqual({ entityIds: ["e1"], stat: "ATTACK", amount: 1000 });
  });

  it("BOOST_ATTACK_BY_CARD_ID es no-op si no hay ninguna entity con ese card id", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "BOOST_ATTACK_BY_CARD_ID", targetCardId: "entity-figma", value: 1000 })!;
    expect(result.buff).toEqual({ entityIds: [], stat: "ATTACK", amount: 1000 });
  });

  it("DAMAGE_IF_ALLY_ON_BOARD golpea 2000 solo si está la entity requerida en campo", () => {
    const opponent = { ...createPlayer("b"), healthPoints: 8000, maxHealthPoints: 8000 };
    const withAvast: IPlayer = {
      ...createPlayer("a"),
      activeEntities: [{ instanceId: "e1", card: entityCard("entity-avast", 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }],
    };
    const hit = resolveExecutionEffectFromRegistry(withAvast, opponent, { action: "DAMAGE_IF_ALLY_ON_BOARD", requiredCardId: "entity-avast", value: 2000 })!;
    expect(hit.opponent.healthPoints).toBe(6000);
    expect(hit.damageAmount).toBe(2000);
  });

  it("DAMAGE_IF_ALLY_ON_BOARD no hace nada si no está la entity requerida", () => {
    const opponent = { ...createPlayer("b"), healthPoints: 8000, maxHealthPoints: 8000 };
    const result = resolveExecutionEffectFromRegistry(createPlayer("a"), opponent, { action: "DAMAGE_IF_ALLY_ON_BOARD", requiredCardId: "entity-avast", value: 2000 })!;
    expect(result.opponent.healthPoints).toBe(8000);
    expect(result.damageAmount).toBe(0);
  });

  it("APPLY_NO_DIRECT_ATTACKS devuelve un estado NO_DIRECT_ATTACKS contra el rival", () => {
    const player = createPlayer("a");
    const opponent = createPlayer("b");
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "APPLY_NO_DIRECT_ATTACKS", turns: 3 })!;
    expect(result.addedStatusEffects).toEqual([{ kind: "NO_DIRECT_ATTACKS", targetPlayerId: "b", remainingTurns: 3 }]);
  });

  it("DESTROY_ALL_TRAPS manda al cementerio del rival solo las trampas", () => {
    const player = createPlayer("a");
    const opponent: IPlayer = {
      ...createPlayer("b"),
      activeExecutions: [
        { instanceId: "t1", card: trapCard("trap-1"), mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false },
        { instanceId: "x1", card: { id: "exec-x", name: "x", description: "", type: "EXECUTION", faction: "NEUTRAL", cost: 1 }, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false },
      ],
    };
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "DESTROY_ALL_TRAPS" })!;
    expect(result.opponent.activeExecutions.map((e) => e.instanceId)).toEqual(["x1"]);
    expect(result.opponent.graveyard.map((c) => c.id)).toEqual(["trap-1"]);
    expect(result.systemEvents).toHaveLength(1);
  });

  it("DISCARD_OPPONENT_HAND_CARD descarta la carta más antigua de la mano rival", () => {
    const player = createPlayer("a");
    const opponent: IPlayer = { ...createPlayer("b"), hand: [entityCard("h1", 100), entityCard("h2", 200)] };
    const result = resolveExecutionEffectFromRegistry(player, opponent, { action: "DISCARD_OPPONENT_HAND_CARD", count: 1 })!;
    expect(result.opponent.hand.map((c) => c.id)).toEqual(["h2"]);
    expect(result.opponent.graveyard.map((c) => c.id)).toEqual(["h1"]);
  });
});

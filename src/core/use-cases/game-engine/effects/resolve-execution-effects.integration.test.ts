// src/core/use-cases/game-engine/effects/resolve-execution-effects.integration.test.ts - Pruebas de resolución de efectos de ejecuciones sobre vida, daño y buffs.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createNeutralEntityCard, createResolveExecutionBaseState } from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";

const drawExecution: ICard = {
  id: "exec-draw-test",
  name: "Draw Test",
  description: "Roba 1 carta.",
  type: "EXECUTION",
  faction: "OPEN_SOURCE",
  cost: 1,
  effect: { action: "DRAW_CARD", cards: 1 },
};

describe("resolveExecution effects", () => {
  it("debería robar cartas al resolver DRAW_CARD", () => {
    let state = createResolveExecutionBaseState({
      deck: [{ id: "entity-deck", name: "Deck Entity", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 800, defense: 1000 }],
      hand: [drawExecution],
    });
    state = GameEngine.playCard(state, "p1", "exec-draw-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    expect(state.playerA.hand).toHaveLength(1);
    expect(state.playerA.hand[0].id).toBe("entity-deck");
    expect(state.playerA.deck).toHaveLength(0);
  });

  it("debería conservar la mano existente y añadir la carta robada al resolver DRAW_CARD", () => {
    const keepA: ICard = {
      id: "entity-keep-a",
      name: "Keep A",
      description: "",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 1,
      attack: 500,
      defense: 500,
    };
    const keepB: ICard = {
      id: "entity-keep-b",
      name: "Keep B",
      description: "",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 1,
      attack: 600,
      defense: 400,
    };
    let state = createResolveExecutionBaseState({
      deck: [{ id: "entity-deck-2", name: "Deck Entity 2", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 900, defense: 900 }],
      hand: [drawExecution, keepA, keepB],
    });
    state = GameEngine.playCard(state, "p1", "exec-draw-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    expect(state.playerA.hand).toHaveLength(3);
    expect(state.playerA.hand.some((card) => card.id === "entity-keep-a")).toBe(true);
    expect(state.playerA.hand.some((card) => card.id === "entity-keep-b")).toBe(true);
    expect(state.playerA.hand.some((card) => card.id === "entity-deck-2")).toBe(true);
    expect(state.playerA.deck).toHaveLength(0);
  });

  it("debería aplicar BOOST_ATTACK_ALLIED_ENTITY sobre la mejor entidad aliada", () => {
    const buffExecution: ICard = {
      id: "exec-atk-buff-test",
      name: "Atk Buff",
      description: "Buff ataque",
      type: "EXECUTION",
      faction: "BIG_TECH",
      cost: 1,
      effect: { action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 },
    };
    let state = createResolveExecutionBaseState({
      hand: [buffExecution],
      activeEntities: [
        { instanceId: "weak", card: createNeutralEntityCard("weak-card", 1000, 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
        { instanceId: "strong", card: createNeutralEntityCard("strong-card", 1500, 1000), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
      ],
    });

    state = GameEngine.playCard(state, "p1", "exec-atk-buff-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    const boosted = state.playerA.activeEntities.find((entity) => entity.instanceId === "strong");
    const notBoosted = state.playerA.activeEntities.find((entity) => entity.instanceId === "weak");

    expect(boosted?.card.attack).toBe(1900);
    expect(notBoosted?.card.attack).toBe(1000);
  });

  it("debería bloquear BOOST_ATTACK_ALLIED_ENTITY sin entidades aliadas", () => {
    const buffExecution: ICard = {
      id: "exec-atk-buff-empty",
      name: "Atk Buff Empty",
      description: "Buff ataque",
      type: "EXECUTION",
      faction: "BIG_TECH",
      cost: 1,
      effect: { action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 },
    };
    let state = createResolveExecutionBaseState({
      hand: [buffExecution],
      activeEntities: [],
    });

    state = GameEngine.playCard(state, "p1", "exec-atk-buff-empty", "ACTIVATE");
    expect(() => GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId)).toThrow(
      "No tienes entidades en campo para aumentar ATK.",
    );
  });

  it("debería registrar HEAL_APPLIED al resolver curación", () => {
    const healExecution: ICard = {
      id: "exec-heal-test",
      name: "Heal Test",
      description: "Cura 500.",
      type: "EXECUTION",
      faction: "NO_CODE",
      cost: 1,
      effect: { action: "HEAL", target: "PLAYER", value: 500 },
    };
    let state = createResolveExecutionBaseState({
      healthPoints: 7000,
      hand: [healExecution],
    });

    state = GameEngine.playCard(state, "p1", "exec-heal-test", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    const healLog = [...state.combatLog].reverse().find((event) => event.eventType === "HEAL_APPLIED");
    expect(healLog?.payload).toMatchObject({ targetPlayerId: "p1", amount: 500 });
    expect(state.playerA.healthPoints).toBe(7500);
  });

  it("debería subir +1000 DEF de Docker solo durante el duelo", () => {
    const dockerDefenseExecution: ICard = {
      id: "exec-docker-defense",
      name: "Docker Fortress",
      description: "Sube +1000 DEF a Docker.",
      type: "EXECUTION",
      faction: "OPEN_SOURCE",
      cost: 1,
      effect: { action: "BOOST_DEFENSE_BY_CARD_ID", targetCardId: "entity-docker", value: 1000 },
    };
    let state = createResolveExecutionBaseState({
      hand: [dockerDefenseExecution],
      activeEntities: [
        { instanceId: "docker-1", card: { ...createNeutralEntityCard("entity-docker", 1500, 300), id: "entity-docker" }, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
        { instanceId: "other-1", card: createNeutralEntityCard("entity-react", 1400, 700), mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false },
      ],
    });

    state = GameEngine.playCard(state, "p1", "exec-docker-defense", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);

    const docker = state.playerA.activeEntities.find((entity) => entity.instanceId === "docker-1");
    const other = state.playerA.activeEntities.find((entity) => entity.instanceId === "other-1");
    expect(docker?.card.defense).toBe(1300);
    expect(other?.card.defense).toBe(700);
  });

  it("debería dejar la energía rival a 0 con DRAIN_OPPONENT_ENERGY", () => {
    const drainExecution: ICard = {
      id: "exec-drain-opponent-energy",
      name: "Energy Breach",
      description: "Drena toda la energía rival.",
      type: "EXECUTION",
      faction: "OPEN_SOURCE",
      cost: 1,
      effect: { action: "DRAIN_OPPONENT_ENERGY" },
    };
    let state = createResolveExecutionBaseState({
      hand: [drainExecution],
    });
    state = { ...state, playerB: { ...state.playerB, currentEnergy: 4 } };

    state = GameEngine.playCard(state, "p1", "exec-drain-opponent-energy", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions[0].instanceId);
    expect(state.playerB.currentEnergy).toBe(0);
  });

  it("debería subir versión y nivel de DuckDuckGo en todas sus copias del duelo", () => {
    const duckProgressExecution: ICard = {
      id: "exec-duck-progress",
      name: "Duck Progress",
      description: "",
      type: "EXECUTION",
      faction: "NO_CODE",
      cost: 1,
      effect: { action: "SET_CARD_DUEL_PROGRESS", targetCardId: "entity-duckduckgo", level: 5, versionTier: 5 },
    };
    const duckInDeck = { ...createNeutralEntityCard("entity-duckduckgo", 1000, 1700), level: 1, versionTier: 1 };
    const duckInField = { ...createNeutralEntityCard("entity-duckduckgo", 1000, 1700), level: 2, versionTier: 2 };
    let state = createResolveExecutionBaseState({
      hand: [duckProgressExecution],
      deck: [duckInDeck],
      activeEntities: [{ instanceId: "duck-field", card: duckInField, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }],
    });

    state = GameEngine.playCard(state, "p1", "exec-duck-progress", "ACTIVATE");
    state = GameEngine.resolveExecution(state, "p1", state.playerA.activeExecutions.find((entity) => entity.card.id === "exec-duck-progress")!.instanceId);

    expect(state.playerA.deck[0].level).toBe(5);
    expect(state.playerA.deck[0].versionTier).toBe(5);
    expect(state.playerA.deck[0].masteryPassiveSkillId).toBe("passive-attack-energy-plus-1");
    expect(state.playerA.deck[0].masteryPassiveLabel).toContain("en ataque");
    const duckField = state.playerA.activeEntities.find((entity) => entity.instanceId === "duck-field");
    expect(duckField?.card.level).toBe(5);
    expect(duckField?.card.versionTier).toBe(5);
    expect(duckField?.card.masteryPassiveSkillId).toBe("passive-attack-energy-plus-1");
    expect(duckField?.card.masteryPassiveLabel).toContain("en ataque");
  });
});


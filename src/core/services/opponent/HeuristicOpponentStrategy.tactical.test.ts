// src/core/services/opponent/HeuristicOpponentStrategy.tactical.test.ts - Valida decisiones tácticas de protección/tempo según perfil IA del rival.
import { describe, expect, it } from "vitest";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { createBaseState } from "@/core/services/opponent/HeuristicOpponentStrategy.test-fixtures";

describe("HeuristicOpponentStrategy táctico", () => {
  it("prioriza setear trampa de protección ante amenaza alta y atacante frágil", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "MYTHIC", aiProfile: { style: "control", aggression: 0.34 } });
    const base = createBaseState();
    const state = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [
          {
            instanceId: "p1-threat",
            card: { id: "p1-threat-card", name: "Threat", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 4, attack: 2600, defense: 1600 },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...base.playerB,
        hand: [
          { id: "bot-fragile", name: "Fragile", description: "", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 3, attack: 1700, defense: 1000 },
          { id: "bot-trap", name: "Mirror", description: "", type: "TRAP" as const, faction: "NO_CODE" as const, cost: 1, trigger: "ON_OPPONENT_ATTACK_DECLARED" as const, effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" as const } },
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toEqual({ cardId: "bot-trap", mode: "SET" });
  });

  it("presiona con entidad ofensiva cuando el perfil es agresivo y hay objetivo SET", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "MYTHIC", aiProfile: { style: "aggressive", aggression: 0.78 } });
    const base = createBaseState();
    const state = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [
          {
            instanceId: "p1-set",
            card: { id: "p1-set-card", name: "Hidden", description: "", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 2, attack: 1300, defense: 1600 },
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...base.playerB,
        hand: [{ id: "bot-rusher", name: "Rusher", description: "", type: "ENTITY" as const, faction: "BIG_TECH" as const, cost: 3, attack: 2100, defense: 1200 }],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toEqual({ cardId: "bot-rusher", mode: "ATTACK" });
  });
});

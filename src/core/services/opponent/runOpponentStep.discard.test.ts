// src/core/services/opponent/runOpponentStep.discard.test.ts - Verifica descarte automático del rival con preferencia por conservar plan de fusión.
import { describe, expect, it } from "vitest";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { createBaseState } from "@/core/services/opponent/HeuristicOpponentStrategy.test-fixtures";
import { runOpponentStep } from "@/core/services/opponent/runOpponentStep";

describe("runOpponentStep discard", () => {
  it("conserva ejecución de fusión en descarte por límite de mano", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const base = createBaseState();
    const state = {
      ...base,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p2" },
      playerB: {
        ...base.playerB,
        fusionDeck: [
          {
            id: "fusion-gemgpt",
            name: "GemGPT",
            description: "",
            type: "FUSION" as const,
            faction: "BIG_TECH" as const,
            cost: 6,
            attack: 2800,
            defense: 2100,
          },
        ],
        hand: [
          {
            id: "exec-fusion-gemgpt",
            name: "Fusion Script",
            description: "",
            type: "EXECUTION" as const,
            faction: "NO_CODE" as const,
            cost: 2,
            effect: { action: "FUSION_SUMMON", recipeId: "fusion-gemgpt", materialsRequired: 2 } as const,
          },
          {
            id: "bot-low-entity",
            name: "Low Unit",
            description: "",
            type: "ENTITY" as const,
            faction: "OPEN_SOURCE" as const,
            cost: 1,
            attack: 200,
            defense: 200,
            archetype: "TOOL" as const,
          },
          {
            id: "bot-mid-entity",
            name: "Mid Unit",
            description: "",
            type: "ENTITY" as const,
            faction: "OPEN_SOURCE" as const,
            cost: 3,
            attack: 1200,
            defense: 1000,
            archetype: "LANGUAGE" as const,
          },
          {
            id: "bot-exec-dmg",
            name: "Damage",
            description: "",
            type: "EXECUTION" as const,
            faction: "NO_CODE" as const,
            cost: 2,
            effect: { action: "DAMAGE", target: "OPPONENT", value: 500 } as const,
          },
          {
            id: "bot-trap",
            name: "Trap",
            description: "",
            type: "TRAP" as const,
            faction: "NO_CODE" as const,
            cost: 1,
            trigger: "ON_OPPONENT_ATTACK_DECLARED" as const,
            effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" as const },
          },
        ],
      },
    };

    const next = runOpponentStep(state, "p2", strategy);
    expect(next.pendingTurnAction).toBeNull();
    expect(next.playerB.hand.some((card) => card.id === "exec-fusion-gemgpt")).toBe(true);
  });
});

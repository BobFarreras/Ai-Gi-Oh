// src/app/api/story/overworld/claim-reward/internal/resolve-claim-reward.test.ts - Plan de recompensa de un
// nodo del overworld (ficha 9): qué otorga cada tipo de nodo, con REWARD_OBJECT validando su configuración.
import { describe, expect, it } from "vitest";
import { IStoryMapVirtualNodeDefinition } from "@/services/story/map-definitions/story-map-definition-types";
import { resolveClaimRewardPlan } from "./resolve-claim-reward";

function definition(overrides: Partial<IStoryMapVirtualNodeDefinition>): IStoryMapVirtualNodeDefinition {
  return {
    id: "story-ch3-test",
    chapter: 3,
    duelIndex: 900,
    nodeType: "EVENT",
    title: "Test",
    opponentName: "Repositorio",
    difficulty: "STANDARD",
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    isBossDuel: false,
    unlockRequirementNodeId: null,
    href: "#",
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

describe("resolveClaimRewardPlan", () => {
  it("REWARD_OBJECT devuelve el objeto configurado (cantidad por defecto 1)", () => {
    const plan = resolveClaimRewardPlan(
      definition({ nodeType: "REWARD_OBJECT", rewardObjectType: "LEVEL_CANDY", rewardObjectId: "candy-usb-raro-1" }),
    );
    expect(plan).toEqual({
      rewardNexus: 0,
      rewardCardId: null,
      rewardObject: { itemType: "LEVEL_CANDY", itemId: "candy-usb-raro-1", quantity: 1 },
    });
  });

  it("REWARD_OBJECT mal configurado (sin objeto) no es reclamable", () => {
    expect(resolveClaimRewardPlan(definition({ nodeType: "REWARD_OBJECT" }))).toBeNull();
  });

  it("REWARD_NEXUS y REWARD_CARD conservan su comportamiento", () => {
    expect(resolveClaimRewardPlan(definition({ nodeType: "REWARD_NEXUS", rewardNexus: 420 }))).toEqual({
      rewardNexus: 420,
      rewardCardId: null,
      rewardObject: null,
    });
    expect(resolveClaimRewardPlan(definition({ nodeType: "REWARD_CARD", rewardCardId: "fusion-pytgress" }))).toEqual({
      rewardNexus: 0,
      rewardCardId: "fusion-pytgress",
      rewardObject: null,
    });
  });

  it("los nodos no-recompensa (EVENT/DUEL) y el nodo inexistente no son reclamables", () => {
    expect(resolveClaimRewardPlan(definition({ nodeType: "EVENT" }))).toBeNull();
    expect(resolveClaimRewardPlan(definition({ nodeType: "DUEL" }))).toBeNull();
    expect(resolveClaimRewardPlan(null)).toBeNull();
  });
});

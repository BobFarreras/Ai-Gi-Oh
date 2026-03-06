// src/core/services/progression/card-experience-rules.test.ts - Pruebas de asignación y agregado de EXP por eventos de carta.
import { describe, expect, it } from "vitest";
import { aggregateCardExperienceEvents, getCardExperienceForEvent } from "./card-experience-rules";

describe("card-experience-rules", () => {
  it("asigna EXP por tipo de evento", () => {
    expect(getCardExperienceForEvent("SUMMON_SUCCESS")).toBe(10);
    expect(getCardExperienceForEvent("DESTROY_ENEMY_ENTITY")).toBe(25);
    expect(getCardExperienceForEvent("ACTIVATE_EFFECT")).toBe(20);
    expect(getCardExperienceForEvent("DIRECT_HIT")).toBe(30);
  });

  it("agrega eventos por cardId", () => {
    const result = aggregateCardExperienceEvents([
      { cardId: "entity-python", eventType: "SUMMON_SUCCESS" },
      { cardId: "entity-python", eventType: "DIRECT_HIT" },
      { cardId: "entity-react", eventType: "ACTIVATE_EFFECT" },
    ]);
    expect(result).toEqual(
      expect.arrayContaining([
        { cardId: "entity-python", gainedXp: 40 },
        { cardId: "entity-react", gainedXp: 20 },
      ]),
    );
  });
});


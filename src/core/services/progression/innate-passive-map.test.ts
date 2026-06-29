// src/core/services/progression/innate-passive-map.test.ts - Verifica el mapa de pasivas innatas y su inyección en el catálogo en código.
import { describe, expect, it } from "vitest";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { INNATE_PASSIVE_SKILL_BY_CARD_ID, resolveInnatePassiveSkillId } from "./innate-passive-map";

describe("innate-passive-map", () => {
  it("resuelve la pasiva innata por id (y null si no tiene)", () => {
    expect(resolveInnatePassiveSkillId("entity-n8n")).toBe("passive-atk-drain-200");
    expect(resolveInnatePassiveSkillId("entity-desconocida")).toBeNull();
  });

  it("inyecta la pasiva innata en las cartas del catálogo en código (oponentes de training/arena)", () => {
    const presentInMock = Object.keys(INNATE_PASSIVE_SKILL_BY_CARD_ID).filter((id) => CARD_BY_ID.has(id));
    expect(presentInMock.length).toBeGreaterThan(0);
    for (const cardId of presentInMock) {
      expect(CARD_BY_ID.get(cardId)?.masteryPassiveSkillId).toBe(INNATE_PASSIVE_SKILL_BY_CARD_ID[cardId]);
    }
  });
});

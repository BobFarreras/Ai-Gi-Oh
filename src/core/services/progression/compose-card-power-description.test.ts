// src/core/services/progression/compose-card-power-description.test.ts - Pruebas de la composición poder + descripción.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { composeCardPowerDescription } from "./compose-card-power-description";

const baseCard: Pick<ICard, "description" | "masteryPassiveSkillId" | "versionTier"> = {
  description: "Automatización de flujos para ganar ventaja.",
};

describe("composeCardPowerDescription", () => {
  it("devuelve solo la descripción si la carta no tiene pasiva", () => {
    expect(composeCardPowerDescription(baseCard)).toBe("Automatización de flujos para ganar ventaja.");
  });

  it("antepone el poder con la magnitud base (V0) cuando no hay versión", () => {
    const result = composeCardPowerDescription({ ...baseCard, masteryPassiveSkillId: "passive-atk-drain-200" });
    expect(result).toContain("reduce 100 ATK");
    expect(result.endsWith("Automatización de flujos para ganar ventaja.")).toBe(true);
  });

  it("usa la magnitud plena a V5", () => {
    const result = composeCardPowerDescription({ ...baseCard, masteryPassiveSkillId: "passive-atk-drain-200", versionTier: 5 });
    expect(result).toContain("reduce 200 ATK");
  });
});

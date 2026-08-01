// src/core/services/survival/apply-survival-ascension.test.ts - Verifica caps y refuerzo infinito de entidades.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";
import { applySurvivalAscension } from "./apply-survival-ascension";

const entity = {
  id: "entity-test", name: "Test", description: "Carta de prueba", type: "ENTITY",
  faction: "OPEN_SOURCE", archetype: "TOOL", cost: 1, attack: 1500, defense: 1200,
  level: 28, xp: 0, versionTier: 4, renderUrl: "/test.webp",
} as ICard;

describe("applySurvivalAscension", () => {
  it("sube nivel y versión con el rango y mantiene el crecimiento de stats", () => {
    const [scaled] = applySurvivalAscension([entity], 3, 150);

    expect(scaled).toMatchObject({
      level: 34,
      versionTier: 5,
      attack: 1950,
      defense: 1650,
    });
  });

  it("no pasa del nivel máximo del juego por muchas vueltas que se acumulen", () => {
    const [scaled] = applySurvivalAscension([entity], 999, 0);

    expect(scaled).toMatchObject({ level: getMaxCardLevel(), versionTier: MAX_CARD_VERSION_TIER });
  });

  it("no altera stats en el rango base", () => {
    expect(applySurvivalAscension([entity], 0, 150)[0]).toEqual(entity);
  });
});

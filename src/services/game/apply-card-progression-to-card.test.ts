// src/services/game/apply-card-progression-to-card.test.ts - Verifica bonus de nivel aplicados a cartas para estado de combate.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { applyCardProgressionToCard } from "./apply-card-progression-to-card";

const ENTITY_CARD: ICard = {
  id: "entity-test",
  name: "Entity Test",
  description: "Carta de prueba",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 4,
  attack: 1000,
  defense: 900,
};

const EXEC_CARD: ICard = {
  id: "exec-test",
  name: "Exec Test",
  description: "Carta de ejecución",
  type: "EXECUTION",
  faction: "OPEN_SOURCE",
  cost: 2,
  effect: { action: "DRAW_CARD", cards: 1 },
};

function createProgress(level: number): IPlayerCardProgress {
  return {
    playerId: "p1",
    cardId: "any",
    versionTier: 0,
    level,
    xp: 0,
    masteryPassiveSkillId: null,
    updatedAtIso: new Date().toISOString(),
  };
}

describe("apply-card-progression-to-card", () => {
  it("aplica los bonus de la curva a ENTITY y el descuento de energía en el nivel 50", () => {
    // Hitos hasta el 20: +50 ATK (5), +100 ATK (10), +50 DEF (15), +100 DEF (20) ⇒ +150/+150.
    const atLevel20 = applyCardProgressionToCard(ENTITY_CARD, createProgress(20));
    expect(atLevel20.attack).toBe(1150);
    expect(atLevel20.defense).toBe(1050);
    expect(atLevel20.cost).toBe(4);

    // El descuento de energía ya no está en el 30: ahora se gana en el 50.
    expect(applyCardProgressionToCard(ENTITY_CARD, createProgress(30)).cost).toBe(4);
    expect(applyCardProgressionToCard(ENTITY_CARD, createProgress(50)).cost).toBe(3);
  });

  it("al nivel máximo suma exactamente +750 ATK y +750 DEF", () => {
    const atLevel100 = applyCardProgressionToCard(ENTITY_CARD, createProgress(100));
    expect(atLevel100.attack).toBe(1750);
    expect(atLevel100.defense).toBe(1650);
  });

  it("estrena el arte de nivel máximo solo al llegar al 100, y cae al render normal si no hay imagen", () => {
    const withArt: ICard = { ...ENTITY_CARD, renderUrl: "/normal.webp", maxLevelRenderUrl: "/nivel-100.webp" };
    expect(applyCardProgressionToCard(withArt, createProgress(99)).renderUrl).toBe("/normal.webp");
    expect(applyCardProgressionToCard(withArt, createProgress(100)).renderUrl).toBe("/nivel-100.webp");

    // Carta sin arte alternativo todavía: al 100 sigue con el suyo (el sistema queda configurado sin imágenes).
    const withoutArt: ICard = { ...ENTITY_CARD, renderUrl: "/normal.webp" };
    expect(applyCardProgressionToCard(withoutArt, createProgress(100)).renderUrl).toBe("/normal.webp");
  });

  it("conserva la pasiva innata (y su etiqueta) desde V1 aunque la progresión no fije pasiva", () => {
    const innateCard: ICard = { ...ENTITY_CARD, masteryPassiveSkillId: "passive-reflect-damage-200" };
    const result = applyCardProgressionToCard(innateCard, createProgress(5));
    expect(result.masteryPassiveSkillId).toBe("passive-reflect-damage-200");
    expect(result.masteryPassiveLabel).toContain("Cortafuegos");
  });

  it("combina nivel + objetos de mejora en una sola pasada (fuente única de la verdad)", () => {
    // Nivel 20 = +150/+150; objetos = +300 ATK / +200 DEF. Se suman UNA vez sobre la base.
    const result = applyCardProgressionToCard(ENTITY_CARD, createProgress(20), { attackBonus: 300, defenseBonus: 200 });
    expect(result.attack).toBe(1000 + 150 + 300);
    expect(result.defense).toBe(900 + 150 + 200);
  });

  it("sin objetos deja solo el bonus de nivel (los objetos no se inventan)", () => {
    const result = applyCardProgressionToCard(ENTITY_CARD, createProgress(20));
    expect(result.attack).toBe(1150);
    expect(result.defense).toBe(1050);
  });

  it("en EXECUTION solo reduce coste al nivel 50", () => {
    const atLevel30 = applyCardProgressionToCard(EXEC_CARD, createProgress(30));
    expect(atLevel30.cost).toBe(2);
    const atLevel50 = applyCardProgressionToCard(EXEC_CARD, createProgress(50));
    expect(atLevel50.cost).toBe(1);
    expect(atLevel50.attack).toBeUndefined();
    expect(atLevel50.defense).toBeUndefined();
  });
});


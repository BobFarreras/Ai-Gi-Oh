// src/core/services/progression/card-level-bonus-rules.test.ts - Pruebas de la curva de bonus por nivel.
import { describe, expect, it } from "vitest";
import { CARD_LEVEL_MILESTONES, hasMaxLevelArt, resolveCardLevelBonuses, resolveLevelUpStatGain } from "./card-level-bonus-rules";

describe("card-level-bonus-rules", () => {
  it("sigue el ciclo +50 ATK / +100 ATK / +50 DEF / +100 DEF cada 5 niveles", () => {
    expect(resolveCardLevelBonuses("ENTITY", 4)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 5)).toEqual({ attackBonus: 50, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 10)).toEqual({ attackBonus: 150, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 15)).toEqual({ attackBonus: 150, defenseBonus: 50, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("ENTITY", 20)).toEqual({ attackBonus: 150, defenseBonus: 150, energyCostReduction: 0 });
    // El ciclo vuelve a empezar: el 25 es otra vez +50 ATK.
    expect(resolveCardLevelBonuses("ENTITY", 25)).toEqual({ attackBonus: 200, defenseBonus: 150, energyCostReduction: 0 });
  });

  it("los bonus solo se ganan en los hitos, no en los niveles intermedios", () => {
    expect(resolveCardLevelBonuses("ENTITY", 9)).toEqual(resolveCardLevelBonuses("ENTITY", 5));
  });

  it("el descuento de energía llega en el 50 (no antes)", () => {
    expect(resolveCardLevelBonuses("ENTITY", 49).energyCostReduction).toBe(0);
    expect(resolveCardLevelBonuses("ENTITY", 50).energyCostReduction).toBe(1);
  });

  it("al nivel máximo acumula exactamente +750 ATK y +750 DEF", () => {
    // Es el presupuesto de nivel del que depende el modelo de topes de los objetos: si esto cambia, hay que
    // recalcular los topes (techo = base + 750 + presupuesto de objetos).
    expect(resolveCardLevelBonuses("ENTITY", 100)).toEqual({ attackBonus: 750, defenseBonus: 750, energyCostReduction: 1 });
    expect(CARD_LEVEL_MILESTONES).toHaveLength(20);
  });

  it("en no-ENTITY solo aplica la reducción de energía", () => {
    expect(resolveCardLevelBonuses("TRAP", 30)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 0 });
    expect(resolveCardLevelBonuses("FUSION", 50)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 1 });
    expect(resolveCardLevelBonuses("EXECUTION", 100)).toEqual({ attackBonus: 0, defenseBonus: 0, energyCostReduction: 1 });
  });

  it("el arte alternativo se desbloquea solo en el nivel 100", () => {
    expect(hasMaxLevelArt(99)).toBe(false);
    expect(hasMaxLevelArt(100)).toBe(true);
  });

  describe("resolveLevelUpStatGain", () => {
    it("da el incremento del hito cruzado (nivel 4 → 5 ⇒ +50 ATK)", () => {
      expect(resolveLevelUpStatGain("ENTITY", 4, 5)).toEqual({ attack: 50, defense: 0 });
    });

    it("acumula varios hitos en un salto grande (nivel 4 → 20 ⇒ +150 ATK / +150 DEF)", () => {
      expect(resolveLevelUpStatGain("ENTITY", 4, 20)).toEqual({ attack: 150, defense: 150 });
    });

    it("es 0/0 si no se cruza ningún hito (subir dentro del mismo tramo)", () => {
      expect(resolveLevelUpStatGain("ENTITY", 5, 9)).toEqual({ attack: 0, defense: 0 });
    });

    it("es 0/0 para cartas sin ATK/DEF (magia/trampa)", () => {
      expect(resolveLevelUpStatGain("TRAP", 0, 100)).toEqual({ attack: 0, defense: 0 });
    });
  });
});

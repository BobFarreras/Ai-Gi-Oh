// src/core/services/progression/card-upgrade-rules.test.ts - Modelo de topes de los objetos de mejora ATK/DEF.
import { describe, expect, it } from "vitest";
import { canApplyCardUpgrade, resolveCardUpgradeBudget, resolveRemainingUpgradeBudget } from "./card-upgrade-rules";

describe("card-upgrade-rules", () => {
  it("el presupuesto decrece con el coste base (la carta barata gana más)", () => {
    expect(resolveCardUpgradeBudget(2)).toBe(600);
    expect(resolveCardUpgradeBudget(3)).toBe(500);
    expect(resolveCardUpgradeBudget(4)).toBe(400);
    expect(resolveCardUpgradeBudget(5)).toBe(300);
    expect(resolveCardUpgradeBudget(6)).toBe(200);
  });

  it("costes fuera de rango caen al tope más razonable (defensivo)", () => {
    expect(resolveCardUpgradeBudget(1)).toBe(600);
    expect(resolveCardUpgradeBudget(8)).toBe(200);
  });

  it("permite aplicar mientras no se pase del presupuesto del stat", () => {
    // Coste 4 → presupuesto 400. Con +300 ya puestos, un +100 cabe (400) pero un +200 no.
    expect(canApplyCardUpgrade(4, "ATTACK", { attackBonus: 300, defenseBonus: 0 }, 100)).toBe(true);
    expect(canApplyCardUpgrade(4, "ATTACK", { attackBonus: 300, defenseBonus: 0 }, 200)).toBe(false);
  });

  it("cada stat tiene su propio presupuesto (ATK no consume el de DEF)", () => {
    // Coste 6 → 200 por stat. ATK lleno no impide mejorar DEF.
    expect(canApplyCardUpgrade(6, "DEFENSE", { attackBonus: 200, defenseBonus: 0 }, 200)).toBe(true);
  });

  it("informa del margen restante por stat", () => {
    expect(resolveRemainingUpgradeBudget(3, { attackBonus: 200, defenseBonus: 500 })).toEqual({ attackBonus: 300, defenseBonus: 0 });
  });
});

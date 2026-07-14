// src/core/services/progression/level-candy-rules.test.ts - Reglas del USB Raro (caramelos de nivel).
import { describe, expect, it } from "vitest";
import { getTotalXpRequiredToReachLevel, getMaxCardLevel } from "./card-level-rules";
import { canConsumeCandy, resolveCandyGrant } from "./level-candy-rules";

describe("level-candy-rules", () => {
  it("sube exactamente los niveles prometidos, esté donde esté la carta", () => {
    expect(resolveCandyGrant(10, getTotalXpRequiredToReachLevel(10), 2).newLevel).toBe(12);
    expect(resolveCandyGrant(80, getTotalXpRequiredToReachLevel(80), 2).newLevel).toBe(82);
  });

  it("el MISMO caramelo cuesta mucha más XP arriba que abajo (por eso vale más)", () => {
    // Es la razón por la que el caramelo se define en NIVELES y no en XP fija: con XP fija sería inservible
    // en el tramo alto.
    const enNivel10 = resolveCandyGrant(10, getTotalXpRequiredToReachLevel(10), 2).grantedXp;
    const enNivel80 = resolveCandyGrant(80, getTotalXpRequiredToReachLevel(80), 2).grantedXp;
    expect(enNivel10).toBe(625); // niveles 10→12
    expect(enNivel80).toBe(4265); // niveles 80→82: casi 7 veces más XP por el mismo "+2"
    expect(enNivel80).toBeGreaterThan(enNivel10 * 5);
  });

  it("conserva el progreso parcial dentro del nivel en curso (no se tira medio nivel)", () => {
    const xpConMedioNivel = getTotalXpRequiredToReachLevel(10) + 100;
    const grant = resolveCandyGrant(10, xpConMedioNivel, 1);
    expect(grant.newLevel).toBe(11);
    // La XP sobrante sigue ahí: la carta queda a 100 de XP dentro del nivel 11.
    expect(grant.newXp).toBe(getTotalXpRequiredToReachLevel(11) + 100);
  });

  it("permite llegar al nivel máximo desde el 95 con un +5 (sin desperdicio)", () => {
    const grant = resolveCandyGrant(95, getTotalXpRequiredToReachLevel(95), 5);
    expect(grant.newLevel).toBe(getMaxCardLevel());
    expect(grant.wastedLevels).toBe(0);
  });

  it("avisa de los niveles desperdiciados al pasarse del máximo", () => {
    const grant = resolveCandyGrant(98, getTotalXpRequiredToReachLevel(98), 5);
    expect(grant.newLevel).toBe(100);
    expect(grant.wastedLevels).toBe(3); // el jugador debe poder verlo ANTES de gastarlo
  });

  it("una carta al máximo ya no puede consumir caramelos", () => {
    expect(canConsumeCandy(100)).toBe(false);
    expect(canConsumeCandy(99)).toBe(true);
  });
});

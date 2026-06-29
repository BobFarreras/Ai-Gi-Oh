// src/core/services/effects/effect-catalog.test.ts - Pruebas de las utilidades del catálogo de efectos.
import { describe, expect, it } from "vitest";
import { describeEffectJson, findEffectByKey, getEffectActionOptions, EFFECT_CATALOG } from "./effect-catalog";

describe("effect-catalog", () => {
  it("incluye las 10 pasivas mastery con nombre y descripción", () => {
    const passives = EFFECT_CATALOG.filter((item) => item.category === "PASSIVE");
    expect(passives).toHaveLength(10);
    expect(passives.every((item) => item.name && item.description)).toBe(true);
  });

  it("las opciones del editor solo incluyen efectos con JSON de ejemplo", () => {
    const options = getEffectActionOptions();
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((item) => typeof item.exampleJson === "string")).toBe(true);
    // Las pasivas y triggers no son acciones de `effect`.
    expect(options.some((item) => item.category === "PASSIVE" || item.category === "TRAP_TRIGGER")).toBe(false);
  });

  it("interpreta un JSON de efecto válido", () => {
    const described = describeEffectJson('{"action":"NEGATE_OPPONENT_TRAP_AND_DESTROY"}');
    expect(described?.name).toBe("Negar y destruir trampa");
  });

  it("devuelve null ante JSON inválido o sin acción conocida", () => {
    expect(describeEffectJson("no-es-json")).toBeNull();
    expect(describeEffectJson('{"foo":1}')).toBeNull();
    expect(describeEffectJson('{"action":"ACCION_INEXISTENTE"}')).toBeNull();
  });

  it("encuentra un efecto por su key técnica", () => {
    expect(findEffectByKey("DAMAGE")?.category).toBe("EXECUTION");
    expect(findEffectByKey("ON_OPPONENT_ATTACK_DECLARED")?.category).toBe("TRAP_TRIGGER");
  });
});

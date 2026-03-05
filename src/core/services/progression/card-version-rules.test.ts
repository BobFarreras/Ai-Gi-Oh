// src/core/services/progression/card-version-rules.test.ts - Testea costes de versión y validaciones de progresión V0..V5.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { canUpgradeCardVersion, getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";

describe("card-version-rules", () => {
  it("resuelve costes de evolución esperados incluido V4->V5 en 64", () => {
    expect(getCopiesNeededForNextVersion(0)).toBe(4);
    expect(getCopiesNeededForNextVersion(1)).toBe(8);
    expect(getCopiesNeededForNextVersion(2)).toBe(16);
    expect(getCopiesNeededForNextVersion(3)).toBe(32);
    expect(getCopiesNeededForNextVersion(4)).toBe(64);
    expect(getCopiesNeededForNextVersion(5)).toBeNull();
  });

  it("valida condiciones de subida con copias en almacén", () => {
    expect(canUpgradeCardVersion(0, 3)).toBe(false);
    expect(canUpgradeCardVersion(0, 4)).toBe(true);
    expect(canUpgradeCardVersion(5, 999)).toBe(false);
  });

  it("lanza error en tiers inválidos", () => {
    expect(() => getCopiesNeededForNextVersion(-1)).toThrow(ValidationError);
    expect(() => getCopiesNeededForNextVersion(6)).toThrow(ValidationError);
  });
});

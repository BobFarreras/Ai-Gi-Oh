// src/core/errors/AppError.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { NotFoundError } from "./NotFoundError";
import { ValidationError } from "./ValidationError";
import { GameRuleError } from "./GameRuleError";
import { isAppError } from "./isAppError";

describe("Errores de dominio", () => {
  it("debería preservar código y mensaje en ValidationError", () => {
    const error = new ValidationError("Dato inválido.");

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Dato inválido.");
    expect(isAppError(error)).toBe(true);
  });

  it("debería preservar código y mensaje en GameRuleError", () => {
    const error = new GameRuleError("No puedes atacar en esta fase.");

    expect(error.code).toBe("GAME_RULE_ERROR");
    expect(error.message).toBe("No puedes atacar en esta fase.");
    expect(isAppError(error)).toBe(true);
  });

  it("debería preservar código y mensaje en NotFoundError", () => {
    const error = new NotFoundError("Carta no encontrada.");

    expect(error.code).toBe("NOT_FOUND_ERROR");
    expect(error.message).toBe("Carta no encontrada.");
    expect(isAppError(error)).toBe(true);
  });
});


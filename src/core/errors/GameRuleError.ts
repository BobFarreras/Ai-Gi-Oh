// src/core/errors/GameRuleError.ts - Descripción breve del módulo.
import { AppError } from "./AppError";

export class GameRuleError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("GAME_RULE_ERROR", message, details);
  }
}


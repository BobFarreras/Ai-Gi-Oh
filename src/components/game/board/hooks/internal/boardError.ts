// src/components/game/board/hooks/internal/boardError.ts - Descripción breve del módulo.
import { AppError } from "@/core/errors/AppError";
import { isAppError } from "@/core/errors/isAppError";

export interface IBoardUiError {
  code: AppError["code"];
  message: string;
}

export function toBoardUiError(error: unknown): IBoardUiError {
  if (isAppError(error)) {
    return { code: error.code, message: error.message };
  }

  return { code: "GAME_RULE_ERROR", message: "Ha ocurrido un error inesperado en el tablero." };
}


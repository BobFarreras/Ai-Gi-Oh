// src/core/errors/NotFoundError.ts - Descripción breve del módulo.
import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("NOT_FOUND_ERROR", message, details);
  }
}


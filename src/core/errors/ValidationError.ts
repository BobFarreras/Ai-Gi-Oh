// src/core/errors/ValidationError.ts - Descripción breve del módulo.
import { AppError } from "./AppError";

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
  }
}


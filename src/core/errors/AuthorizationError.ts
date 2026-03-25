// src/core/errors/AuthorizationError.ts - Error tipado para denegar acceso a recursos administrativos protegidos.
import { AppError } from "./AppError";

export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("AUTHORIZATION_ERROR", message, details);
  }
}

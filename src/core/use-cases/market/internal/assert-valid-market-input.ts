// src/core/use-cases/market/internal/assert-valid-market-input.ts - Validaciones comunes de entrada para casos de uso del mercado.
import { ValidationError } from "@/core/errors/ValidationError";

export function assertValidPlayerId(playerId: string): void {
  if (!playerId.trim()) {
    throw new ValidationError("El identificador de jugador es obligatorio.");
  }
}

export function assertValidResourceId(resourceId: string, label: string): void {
  if (!resourceId.trim()) {
    throw new ValidationError(`El identificador de ${label} es obligatorio.`);
  }
}

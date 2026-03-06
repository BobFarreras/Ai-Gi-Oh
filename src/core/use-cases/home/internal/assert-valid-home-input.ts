// src/core/use-cases/home/internal/assert-valid-home-input.ts - Validaciones reutilizables de input para casos de uso de Mi Home.
import { ValidationError } from "@/core/errors/ValidationError";

export function assertValidPlayerId(playerId: string): void {
  if (!playerId.trim()) {
    throw new ValidationError("El identificador de jugador es obligatorio.");
  }
}

export function assertValidCardId(cardId: string): void {
  if (!cardId.trim()) {
    throw new ValidationError("El identificador de carta es obligatorio.");
  }
}

export function assertValidDeckIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0) {
    throw new ValidationError("El índice de slot no es válido.");
  }
}

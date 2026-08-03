// src/core/errors/CombatProofError.ts - Expresa rechazos seguros del protocolo autoritativo de replay.
import { ValidationError } from "./ValidationError";

export class CombatProofError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = "CombatProofError";
  }
}

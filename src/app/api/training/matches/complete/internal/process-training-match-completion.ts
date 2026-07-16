// src/app/api/training/matches/complete/internal/process-training-match-completion.ts - Normaliza payload HTTP de training y ejecuta cierre de partida.
import { ValidationError } from "@/core/errors/ValidationError";
import { CompleteTrainingMatchUseCase } from "@/core/use-cases/training/CompleteTrainingMatchUseCase";
import { readRequiredIntegerField, readRequiredStringField } from "@/services/security/api/request-body-parser";
import { CreditPassiveNexusFn, creditPassiveNexus, parsePassiveNexusClaim } from "@/services/progression/credit-passive-nexus";
import { ITrainingMatchClaimRepository } from "@/core/repositories/ITrainingMatchClaimRepository";
import { ITrainingProgressRepository } from "@/core/repositories/ITrainingProgressRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";

interface IProcessTrainingMatchCompletionInput {
  playerId: string;
  payload: Record<string, unknown>;
  nowIso?: string;
  dependencies: {
    claimRepository: ITrainingMatchClaimRepository;
    trainingProgressRepository: ITrainingProgressRepository;
    walletRepository: IWalletRepository;
    playerProgressRepository: IPlayerProgressRepository;
    /** Inyectable en tests; por defecto la acreditación real vía RPC service-role. */
    creditPassiveNexus?: CreditPassiveNexusFn;
  };
}

function parseOutcome(payload: Record<string, unknown>): "WIN" | "LOSE" | "DRAW" {
  const outcome = readRequiredStringField(payload, "outcome", "El resultado del combate es obligatorio.");
  if (outcome === "WIN" || outcome === "LOSE" || outcome === "DRAW") return outcome;
  throw new ValidationError("El resultado del combate training es inválido.");
}

/**
 * Ejecuta cierre de combate training desde API y devuelve payload listo para respuesta JSON.
 */
export async function processTrainingMatchCompletion(input: IProcessTrainingMatchCompletionInput) {
  const battleId = readRequiredStringField(input.payload, "battleId", "El battleId es obligatorio para idempotencia training.");
  const tier = readRequiredIntegerField(input.payload, "tier", "El tier del combate training es obligatorio.");
  const outcome = parseOutcome(input.payload);
  const useCase = new CompleteTrainingMatchUseCase(input.dependencies);
  const result = await useCase.execute({
    playerId: input.playerId,
    battleId,
    tier,
    outcome,
    updatedAtIso: input.nowIso ?? new Date().toISOString(),
  });
  // Recaudación (ficha 3): Arena es modo con recompensa → paga (el duelo llegó a su fin: WIN/LOSE/DRAW).
  // La RPC aplica idempotencia y topes (600/duelo, 1200/día); aquí solo se valida la forma del reporte.
  const passiveNexusCredited = await (input.dependencies.creditPassiveNexus ?? creditPassiveNexus)(
    input.playerId,
    parsePassiveNexusClaim(input.payload),
  );
  return { ...result, passiveNexusCredited };
}

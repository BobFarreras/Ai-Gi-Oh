// src/core/services/tutorial/resolve-tutorial-final-reward.ts - Resuelve configuración de recompensa final del tutorial sin acoplarla a UI.
import { ValidationError } from "@/core/errors/ValidationError";

export interface ITutorialFinalRewardConfig {
  kind: "NEXUS";
  nexus: number;
}

/**
 * Obtiene configuración de recompensa final desde entorno con defaults seguros.
 */
export function resolveTutorialFinalReward(): ITutorialFinalRewardConfig {
  const rawNexus = process.env.TUTORIAL_FINAL_REWARD_NEXUS;
  const parsedNexus = rawNexus ? Number.parseInt(rawNexus, 10) : 600;
  if (!Number.isFinite(parsedNexus) || parsedNexus <= 0) {
    throw new ValidationError("La recompensa final de tutorial debe ser un entero positivo.");
  }
  return { kind: "NEXUS", nexus: parsedNexus };
}

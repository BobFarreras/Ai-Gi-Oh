// src/core/entities/training/ITrainingTierDefinition.ts - Contratos de configuración editable para escalado de entrenamiento.
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

export interface ITrainingTierDefinition {
  tier: number;
  code: string;
  requiredWinsInPreviousTier: number;
  aiDifficulty: OpponentDifficulty;
  deckTemplateId: string;
  rewardMultiplier: number;
}

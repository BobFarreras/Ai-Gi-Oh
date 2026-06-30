// src/core/entities/training/ITrainingTierDefinition.ts - Contratos de configuración editable para escalado de entrenamiento.
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

export interface ITrainingTierDefinition {
  tier: number;
  code: string;
  requiredWinsInPreviousTier: number;
  aiDifficulty: OpponentDifficulty;
  deckTemplateId: string;
  rewardMultiplier: number;
  /** Escalado de cartas del rival propio del tier (version/level/xp); null = usa el escalado por dificultad. */
  defaultVersionTier?: number | null;
  defaultLevel?: number | null;
  defaultXp?: number | null;
}

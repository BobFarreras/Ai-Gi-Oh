// src/services/game/match/modes/TrainingMatchController.ts - Controller de modo entrenamiento con contrato común de match.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "@/services/game/match/modes/IModeMatchControllerConfig";

export class TrainingMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "TRAINING" });
  }
}

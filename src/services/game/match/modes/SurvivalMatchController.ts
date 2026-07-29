// src/services/game/match/modes/SurvivalMatchController.ts - Identifica el runtime local de una batalla de Supervivencia.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "./IModeMatchControllerConfig";

export class SurvivalMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "SURVIVAL" });
  }
}

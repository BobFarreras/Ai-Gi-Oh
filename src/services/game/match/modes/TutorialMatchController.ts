// src/services/game/match/modes/TutorialMatchController.ts - Controller de modo tutorial con contrato común de match.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "@/services/game/match/modes/IModeMatchControllerConfig";

export class TutorialMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "TUTORIAL" });
  }
}

// src/services/game/match/modes/StoryMatchController.ts - Controller de modo historia con contrato común de match.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "@/services/game/match/modes/IModeMatchControllerConfig";

export class StoryMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "STORY" });
  }
}

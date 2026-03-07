// src/services/game/match/modes/MultiplayerMatchController.ts - Controller de modo multijugador con contrato común de match.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "@/services/game/match/modes/IModeMatchControllerConfig";

export class MultiplayerMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "MULTIPLAYER" });
  }
}

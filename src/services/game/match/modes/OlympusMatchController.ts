// src/services/game/match/modes/OlympusMatchController.ts - Identifica el runtime local de una batalla de Olimpo.
import { LocalMatchController } from "@/services/game/match/LocalMatchController";
import { IModeMatchControllerConfig } from "./IModeMatchControllerConfig";

export class OlympusMatchController extends LocalMatchController {
  constructor(config: IModeMatchControllerConfig) {
    super({ ...config, mode: "OLYMPUS" });
  }
}

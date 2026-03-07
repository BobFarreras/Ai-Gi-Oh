// src/services/game/match/create-match-controller.ts - Fábrica de controllers de match para centralizar construcción por modo.
import { IMatchConfig, IMatchController } from "@/core/entities/match";
import {
  MultiplayerMatchController,
  StoryMatchController,
  TrainingMatchController,
  TutorialMatchController,
} from "@/services/game/match/modes";

export function createMatchController(config: IMatchConfig): IMatchController {
  const sharedConfig = {
    seed: config.seed,
    initialStateFactory: config.initialStateFactory,
    actionResolver: config.actionResolver,
  };
  switch (config.mode) {
    case "TRAINING":
      return new TrainingMatchController(sharedConfig);
    case "STORY":
      return new StoryMatchController(sharedConfig);
    case "TUTORIAL":
      return new TutorialMatchController(sharedConfig);
    case "MULTIPLAYER":
      return new MultiplayerMatchController(sharedConfig);
  }
}

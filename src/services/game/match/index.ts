// src/services/game/match/index.ts - Exporta contratos de construcción de match desacoplado para capas de aplicación/UI.
export { createMatchController } from "@/services/game/match/create-match-controller";
export { LocalMatchController } from "@/services/game/match/LocalMatchController";
export {
  TrainingMatchController,
  StoryMatchController,
  TutorialMatchController,
  MultiplayerMatchController,
} from "@/services/game/match/modes";

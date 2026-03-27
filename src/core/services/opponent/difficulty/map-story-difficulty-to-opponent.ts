// src/core/services/opponent/difficulty/map-story-difficulty-to-opponent.ts - Traduce dificultad narrativa Story a dificultad táctica del bot.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

/**
 * Alinea etiquetas de Story con los perfiles heurísticos del motor de combate.
 */
export function mapStoryDifficultyToOpponentDifficulty(storyDifficulty: StoryOpponentDifficulty): OpponentDifficulty {
  if (storyDifficulty === "ROOKIE") return "EASY";
  if (storyDifficulty === "STANDARD") return "NORMAL";
  if (storyDifficulty === "ELITE") return "HARD";
  if (storyDifficulty === "BOSS") return "BOSS";
  return "MYTHIC";
}

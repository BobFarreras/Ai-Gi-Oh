import { ICampaignProgress, OpponentDifficulty } from "./types";

export function resolveDifficultyFromCampaign(progress: ICampaignProgress): OpponentDifficulty {
  if (progress.chapterIndex >= 5 || progress.victories >= 20) {
    return "BOSS";
  }

  if (progress.chapterIndex >= 3 || progress.victories >= 10) {
    return "HARD";
  }

  if (progress.chapterIndex >= 2 || progress.victories >= 4) {
    return "NORMAL";
  }

  return "EASY";
}


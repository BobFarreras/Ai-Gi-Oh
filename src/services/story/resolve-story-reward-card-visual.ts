// src/services/story/resolve-story-reward-card-visual.ts - Resuelve imagen y texto visual de recompensas de carta Story por rewardCardId.
interface IStoryRewardCardVisual {
  src: string;
  alt: string;
}

const STORY_REWARD_CARD_VISUAL_BY_ID: Record<string, IStoryRewardCardVisual> = {
  "trap-windows92-crash": {
    src: "/assets/renders/windows92.png",
    alt: "Carta recompensa Windows92",
  },
};

const DEFAULT_STORY_REWARD_CARD_VISUAL: IStoryRewardCardVisual = {
  src: "/assets/renders/wrap.png",
  alt: "Carta recompensa",
};

/**
 * Devuelve el render real de la carta recompensa para mostrarlo en nodo y animaciones.
 */
export function resolveStoryRewardCardVisual(rewardCardId?: string): IStoryRewardCardVisual {
  if (!rewardCardId) return DEFAULT_STORY_REWARD_CARD_VISUAL;
  return STORY_REWARD_CARD_VISUAL_BY_ID[rewardCardId] ?? DEFAULT_STORY_REWARD_CARD_VISUAL;
}

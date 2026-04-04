// src/services/story/resolve-story-reward-card-visual.ts - Resuelve imagen y texto visual de recompensas de carta Story por rewardCardId.
interface IStoryRewardCardVisual {
  src: string;
  alt: string;
}

const DEFAULT_STORY_REWARD_CARD_VISUAL: IStoryRewardCardVisual = {
  src: "/assets/renders/wrap.webp",
  alt: "Carta recompensa",
};

function resolveRenderPathByCardId(cardId: string): string | null {
  if (cardId.startsWith("trap-")) return `/assets/renders/traps/${cardId}.webp`;
  if (cardId.startsWith("exec-")) return `/assets/renders/executions/${cardId}.webp`;
  return null;
}

/**
 * Devuelve el render real de la carta recompensa para mostrarlo en nodo y animaciones.
 */
export function resolveStoryRewardCardVisual(rewardCardId?: string): IStoryRewardCardVisual {
  if (!rewardCardId) return DEFAULT_STORY_REWARD_CARD_VISUAL;
  const dynamicPath = resolveRenderPathByCardId(rewardCardId);
  if (!dynamicPath) return DEFAULT_STORY_REWARD_CARD_VISUAL;
  return {
    src: dynamicPath,
    alt: `Carta recompensa ${rewardCardId}`,
  };
}

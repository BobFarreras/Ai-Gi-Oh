// src/components/hub/story/internal/scene/transitions/use-story-act-transition-navigation.ts - Navega al nuevo acto tras la transición visual para desacoplar side-effects de StoryScene.
"use client";

import { useEffect } from "react";

interface IUseStoryActTransitionNavigationInput {
  actTransitionTargetId: number | null;
  activeActId: number;
  navigateTo: (href: string) => void;
  clearTransition: () => void;
}

/**
 * Ejecuta el cambio de acto con delay controlado para respetar la animación de transición.
 */
export function useStoryActTransitionNavigation(input: IUseStoryActTransitionNavigationInput): void {
  const { actTransitionTargetId, activeActId, navigateTo, clearTransition } = input;

  useEffect(() => {
    if (!actTransitionTargetId) return;
    if (activeActId === actTransitionTargetId) {
      clearTransition();
      return;
    }
    const direction = actTransitionTargetId > activeActId ? "forward" : "backward";
    const navigationTimeoutId = window.setTimeout(
      () => navigateTo(`/hub/story?act=${actTransitionTargetId}&dir=${direction}`),
      820,
    );
    const fallbackClearTimeoutId = window.setTimeout(clearTransition, 2200);
    return () => {
      window.clearTimeout(navigationTimeoutId);
      window.clearTimeout(fallbackClearTimeoutId);
    };
  }, [actTransitionTargetId, activeActId, navigateTo, clearTransition]);
}

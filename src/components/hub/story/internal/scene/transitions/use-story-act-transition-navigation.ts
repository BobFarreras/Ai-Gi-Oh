// src/components/hub/story/internal/scene/transitions/use-story-act-transition-navigation.ts - Navega al nuevo acto tras la transición visual para desacoplar side-effects de StoryScene.
"use client";

import { useEffect } from "react";

interface IUseStoryActTransitionNavigationInput {
  actTransitionTargetId: number | null;
  navigateTo: (href: string) => void;
}

/**
 * Ejecuta el cambio de acto con delay controlado para respetar la animación de transición.
 */
export function useStoryActTransitionNavigation(input: IUseStoryActTransitionNavigationInput): void {
  const { actTransitionTargetId, navigateTo } = input;

  useEffect(() => {
    if (!actTransitionTargetId) return;
    const timeoutId = window.setTimeout(() => navigateTo(`/hub/story?act=${actTransitionTargetId}`), 900);
    return () => window.clearTimeout(timeoutId);
  }, [actTransitionTargetId, navigateTo]);
}

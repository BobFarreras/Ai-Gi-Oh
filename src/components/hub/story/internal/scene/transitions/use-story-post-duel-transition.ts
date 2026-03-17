// src/components/hub/story/internal/scene/transitions/use-story-post-duel-transition.ts - Aplica transición visual al volver de un duelo Story.
"use client";
import { useEffect, useRef } from "react";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";

interface IUseStoryPostDuelTransitionInput {
  transition: IStoryPostDuelTransition | null;
  currentNodeId: string | null;
  setAvatarVisualTarget: (value: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null) => void;
  setRetreatingNodeId: (nodeId: string | null) => void;
}

/**
 * Ejecuta animaciones de retorno Story sin acoplar lógica de transición al componente principal.
 */
export function useStoryPostDuelTransition(input: IUseStoryPostDuelTransitionInput): void {
  const consumedRef = useRef(false);
  useEffect(() => {
    if (!input.transition || consumedRef.current) return;
    consumedRef.current = true;
    if (input.transition.outcome === "WON") {
      input.setRetreatingNodeId(input.transition.duelNodeId);
      return;
    }
    const fallbackNodeId = input.transition.returnNodeId || input.currentNodeId;
    if (!fallbackNodeId) return;
    input.setAvatarVisualTarget({ nodeId: input.transition.duelNodeId, stance: "SIDE" });
    const travelTimeout = window.setTimeout(() => {
      input.setAvatarVisualTarget({ nodeId: fallbackNodeId, stance: "CENTER" });
    }, 260);
    return () => window.clearTimeout(travelTimeout);
  }, [input]);
}

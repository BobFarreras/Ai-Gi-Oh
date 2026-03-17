// src/components/hub/story/internal/scene/transitions/use-story-act-entry-sequence.ts - Orquesta la animación de entrada a un acto desde nodo portal.
"use client";
import { useEffect, useMemo, useState } from "react";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryActTransitionNodeId } from "@/services/story/resolve-story-act-transition-node-id";

interface IUseStoryActEntrySequenceInput {
  nodes: IStoryMapNodeRuntime[];
  activeActId: number;
  currentNodeId: string | null;
  shouldPlayActEntryAnimation: boolean;
}

interface IStoryAvatarVisualTarget {
  nodeId: string;
  stance: "CENTER" | "SIDE" | "PORTAL";
}

/**
 * Reproduce secuencia portal->crecer->mover al nodo objetivo al cargar un acto vía transición.
 */
export function useStoryActEntrySequence(input: IUseStoryActEntrySequenceInput): {
  entryAvatarVisualTarget: IStoryAvatarVisualTarget | null;
  isActEntrySequenceRunning: boolean;
} {
  const transitionNodeId = useMemo(
    () => resolveStoryActTransitionNodeId(input.nodes, input.activeActId),
    [input.nodes, input.activeActId],
  );
  const shouldRun = input.shouldPlayActEntryAnimation && Boolean(transitionNodeId) && Boolean(input.currentNodeId);
  const [isActEntrySequenceRunning, setIsActEntrySequenceRunning] = useState(shouldRun);
  const [entryAvatarVisualTarget, setEntryAvatarVisualTarget] = useState<IStoryAvatarVisualTarget | null>(
    shouldRun && transitionNodeId ? { nodeId: transitionNodeId, stance: "PORTAL" } : null,
  );

  useEffect(() => {
    if (!isActEntrySequenceRunning || !transitionNodeId || !input.currentNodeId) return;
    const destinationNodeId = input.currentNodeId;
    const growTimeoutId = window.setTimeout(() => setEntryAvatarVisualTarget({ nodeId: transitionNodeId, stance: "CENTER" }), 240);
    const moveTimeoutId = window.setTimeout(() => setEntryAvatarVisualTarget({ nodeId: destinationNodeId, stance: "CENTER" }), 560);
    const endTimeoutId = window.setTimeout(() => {
      setEntryAvatarVisualTarget(null);
      setIsActEntrySequenceRunning(false);
    }, 980);
    return () => {
      window.clearTimeout(growTimeoutId);
      window.clearTimeout(moveTimeoutId);
      window.clearTimeout(endTimeoutId);
    };
  }, [isActEntrySequenceRunning, transitionNodeId, input.currentNodeId]);

  return { entryAvatarVisualTarget, isActEntrySequenceRunning };
}

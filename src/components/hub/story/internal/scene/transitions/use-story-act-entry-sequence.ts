// src/components/hub/story/internal/scene/transitions/use-story-act-entry-sequence.ts - Orquesta la animación de entrada a un acto desde nodo portal.
"use client";
import { useEffect, useMemo, useState } from "react";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryActTransitionNodeId } from "@/services/story/resolve-story-act-transition-node-id";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

interface IUseStoryActEntrySequenceInput {
  nodes: IStoryMapNodeRuntime[];
  activeActId: number;
  currentNodeId: string | null;
  shouldPlayActEntryAnimation: boolean;
  direction: "forward" | "backward" | null;
}

function resolveTransitionNodeId(input: {
  nodes: IStoryMapNodeRuntime[];
  activeActId: number;
  direction: "forward" | "backward" | null;
}): string | null {
  if (input.direction === "forward") {
    const previousActId = input.activeActId - 1;
    const expectedId = `story-ch${input.activeActId}-transition-to-act${previousActId}`;
    return input.nodes.find((node) => node.id === expectedId)?.id ?? null;
  }
  if (input.direction === "backward") {
    const nextActId = input.activeActId + 1;
    const expectedId = `story-ch${input.activeActId}-transition-to-act${nextActId}`;
    return input.nodes.find((node) => node.id === expectedId)?.id ?? null;
  }
  return resolveStoryActTransitionNodeId(input.nodes, input.activeActId);
}

function resolveFirstStepNodeFromTransition(input: {
  nodes: IStoryMapNodeRuntime[];
  transitionNodeId: string;
  direction: "forward" | "backward" | null;
}): string | null {
  const transitionNode = input.nodes.find((node) => node.id === input.transitionNodeId);
  if (!transitionNode?.position) return null;
  const transitionPosition = transitionNode.position;
  const candidates = input.nodes.filter(
    (node) => node.id !== input.transitionNodeId && Boolean(node.position),
  );
  if (candidates.length === 0) return null;
  const directionalCandidates = candidates.filter((node) => {
    const deltaX = (node.position?.x ?? 0) - transitionPosition.x;
    if (input.direction === "forward") return deltaX > 0;
    if (input.direction === "backward") return deltaX < 0;
    return true;
  });
  const pool = directionalCandidates.length > 0 ? directionalCandidates : candidates;
  const sorted = [...pool].sort((left, right) => {
    const leftDx = Math.abs((left.position?.x ?? 0) - transitionPosition.x);
    const rightDx = Math.abs((right.position?.x ?? 0) - transitionPosition.x);
    if (leftDx !== rightDx) return leftDx - rightDx;
    const leftDy = Math.abs((left.position?.y ?? 0) - transitionPosition.y);
    const rightDy = Math.abs((right.position?.y ?? 0) - transitionPosition.y);
    return leftDy - rightDy;
  });
  return sorted[0]?.id ?? null;
}

/**
 * Reproduce secuencia portal->crecer->mover al nodo objetivo al cargar un acto vía transición.
 */
export function useStoryActEntrySequence(input: IUseStoryActEntrySequenceInput): {
  entryAvatarVisualTarget: IStoryAvatarVisualTarget | null;
  isActEntrySequenceRunning: boolean;
  entryResolvedNodeId: string | null;
} {
  const transitionNodeId = useMemo(
    () => resolveTransitionNodeId({ nodes: input.nodes, activeActId: input.activeActId, direction: input.direction }),
    [input.nodes, input.activeActId, input.direction],
  );
  const shouldRun = input.shouldPlayActEntryAnimation && Boolean(transitionNodeId) && Boolean(input.currentNodeId);
  const [isActEntrySequenceRunning, setIsActEntrySequenceRunning] = useState(shouldRun);
  const [entryAvatarVisualTarget, setEntryAvatarVisualTarget] = useState<IStoryAvatarVisualTarget | null>(
    shouldRun && transitionNodeId ? { nodeId: transitionNodeId, stance: "PORTAL" } : null,
  );
  const [entryResolvedNodeId, setEntryResolvedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldRun || !transitionNodeId) return;
    // Re-inicializa la secuencia en cada cambio real de acto para evitar estados colgados entre transiciones.
    const rearmTimeoutId = window.setTimeout(() => {
      setEntryResolvedNodeId(null);
      setEntryAvatarVisualTarget({ nodeId: transitionNodeId, stance: "PORTAL" });
      setIsActEntrySequenceRunning(true);
    }, 0);
    return () => window.clearTimeout(rearmTimeoutId);
  }, [shouldRun, transitionNodeId, input.activeActId, input.currentNodeId, input.direction]);

  useEffect(() => {
    if (!isActEntrySequenceRunning || !transitionNodeId || !input.currentNodeId) return;
    const destinationNodeId =
      resolveFirstStepNodeFromTransition({
        nodes: input.nodes,
        transitionNodeId,
        direction: input.direction,
      }) ?? input.currentNodeId;
    // Fases: 1) spawn mínimo en portal, 2) crecer, 3) pausa legible, 4) avanzar un nodo, 5) liberar control.
    const growTimeoutId = window.setTimeout(
      () => setEntryAvatarVisualTarget({ nodeId: transitionNodeId, stance: "CENTER" }),
      820,
    );
    const moveTimeoutId = window.setTimeout(
      () => {
        setEntryAvatarVisualTarget({ nodeId: destinationNodeId, stance: "CENTER" });
        setEntryResolvedNodeId(destinationNodeId);
      },
      1720,
    );
    const endTimeoutId = window.setTimeout(() => {
      setEntryAvatarVisualTarget(null);
      setIsActEntrySequenceRunning(false);
    }, 2460);
    return () => {
      window.clearTimeout(growTimeoutId);
      window.clearTimeout(moveTimeoutId);
      window.clearTimeout(endTimeoutId);
    };
  }, [isActEntrySequenceRunning, transitionNodeId, input.currentNodeId, input.nodes, input.direction]);

  return { entryAvatarVisualTarget, isActEntrySequenceRunning, entryResolvedNodeId };
}

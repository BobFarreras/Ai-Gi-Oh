// src/components/hub/story/internal/scene/effects/use-story-post-boss-win-dialogue.ts - Gestiona diálogo post-victoria de boss y posterior retirada visual en Story.
"use client";

import { useEffect } from "react";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

const ACT2_BOSS_DUEL_NODE_ID = "story-ch2-duel-7";
const ACT2_BOSS_POST_WIN_DIALOG_NODE_ID = "story-ch2-duel-7-post-win";

function buildTransientDialogueNode(input: { id: string; sourceNode: IStoryMapNodeRuntime }): IStoryMapNodeRuntime {
  return {
    ...input.sourceNode,
    id: input.id,
    title: input.sourceNode.title,
    href: "#",
  };
}

/**
 * Inserta una secuencia narrativa post-boss antes de ejecutar la retirada del nodo.
 */
export function useStoryPostBossWinDialogue(input: {
  postDuelTransition: IStoryPostDuelTransition | null;
  nodesById: Record<string, IStoryMapNodeRuntime>;
  isDialogOpen: boolean;
  consumedTransitionIds: string[];
  setConsumedTransitionIds: (updater: (prev: string[]) => string[]) => void;
  setPendingRetreatNodeId: (value: string | null) => void;
  setRetreatingNodeId: (value: string | null) => void;
  startInteractionDialog: (node: IStoryMapNodeRuntime, interactionCount: number) => boolean;
}) {
  const {
    postDuelTransition,
    nodesById,
    isDialogOpen,
    consumedTransitionIds,
    setConsumedTransitionIds,
    setPendingRetreatNodeId,
    setRetreatingNodeId,
    startInteractionDialog,
  } = input;

  useEffect(() => {
    const transition = postDuelTransition;
    const isBossWinTransition =
      transition?.outcome === "WON" &&
      transition.duelNodeId === ACT2_BOSS_DUEL_NODE_ID;
    if (!isBossWinTransition || !transition) return;
    if (consumedTransitionIds.includes(transition.returnNodeId)) return;
    const sourceNode = nodesById[ACT2_BOSS_DUEL_NODE_ID];
    if (!sourceNode || isDialogOpen) return;

    const opened = startInteractionDialog(
      buildTransientDialogueNode({
        id: ACT2_BOSS_POST_WIN_DIALOG_NODE_ID,
        sourceNode,
      }),
      1,
    );
    if (!opened) {
      window.setTimeout(() => {
        setRetreatingNodeId(ACT2_BOSS_DUEL_NODE_ID);
        setConsumedTransitionIds((prev) => [...prev, transition.returnNodeId]);
      }, 0);
      return;
    }

    window.setTimeout(() => {
      setPendingRetreatNodeId(ACT2_BOSS_DUEL_NODE_ID);
      setConsumedTransitionIds((prev) => [...prev, transition.returnNodeId]);
    }, 0);
  }, [
    consumedTransitionIds,
    isDialogOpen,
    nodesById,
    postDuelTransition,
    setConsumedTransitionIds,
    setPendingRetreatNodeId,
    setRetreatingNodeId,
    startInteractionDialog,
  ]);
}

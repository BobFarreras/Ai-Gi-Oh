// src/components/hub/story/internal/scene/dialog/use-story-node-interaction-dialog.ts - Gestiona estado secuencial de diálogos de interacción Story.
"use client";

import { useMemo, useState } from "react";
import {
  IStoryNodeInteractionDialogue,
  IStoryInteractionDialogueLine,
  resolveStoryNodeInteractionDialogue,
} from "@/services/story/resolve-story-node-interaction-dialogue";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

interface IStoryNodeInteractionDialogState {
  dialogue: IStoryNodeInteractionDialogue | null;
  index: number;
}

/**
 * Orquesta apertura, avance y cierre del diálogo narrativo de nodos virtuales.
 */
export function useStoryNodeInteractionDialog() {
  const [state, setState] = useState<IStoryNodeInteractionDialogState>({ dialogue: null, index: 0 });

  const currentLine = useMemo<IStoryInteractionDialogueLine | null>(() => {
    if (!state.dialogue) return null;
    return state.dialogue.lines[state.index] ?? null;
  }, [state.dialogue, state.index]);

  const start = (node: IStoryMapNodeRuntime, interactionCount = 1): boolean => {
    const dialogue = resolveStoryNodeInteractionDialogue(node, interactionCount);
    if (!dialogue) return false;
    setState({ dialogue, index: 0 });
    return true;
  };

  const next = (): void => {
    setState((prev) => {
      if (!prev.dialogue) return prev;
      const isLastLine = prev.index >= prev.dialogue.lines.length - 1;
      if (isLastLine) return { dialogue: null, index: 0 };
      return { ...prev, index: prev.index + 1 };
    });
  };

  const close = (): void => setState({ dialogue: null, index: 0 });

  return {
    isOpen: Boolean(state.dialogue),
    dialogueTitle: state.dialogue?.title ?? "",
    currentLine,
    start,
    next,
    close,
  };
}

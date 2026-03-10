// src/components/hub/story/internal/use-story-auto-node-selection.ts - Automatiza acciones al seleccionar nodos Story en el mapa interactivo.
"use client";

import { useEffect, useRef } from "react";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

interface IUseStoryAutoNodeSelectionInput {
  selectedNode: IStoryMapNodeRuntime | null;
  currentNodeId: string | null;
  isBusy: boolean;
  onAutoMove: () => void;
  onAutoInteract: () => void;
}

/**
 * Ejecuta movimiento o interacción automática una sola vez por selección de nodo.
 */
export function useStoryAutoNodeSelection(input: IUseStoryAutoNodeSelectionInput) {
  const lastSelectionRef = useRef<string | null>(null);

  useEffect(() => {
    const selectedNode = input.selectedNode;
    if (!selectedNode || input.isBusy) return;
    if (!selectedNode.isUnlocked) return;
    if (selectedNode.isVirtualNode && selectedNode.nodeType === "MOVE") return;
    if (lastSelectionRef.current === selectedNode.id) return;
    lastSelectionRef.current = selectedNode.id;

    if (selectedNode.isVirtualNode) {
      input.onAutoInteract();
      return;
    }
    if (selectedNode.id !== input.currentNodeId) {
      input.onAutoMove();
    }
  }, [input]);
}

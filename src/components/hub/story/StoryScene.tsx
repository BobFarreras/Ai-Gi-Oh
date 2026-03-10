// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StoryCircuitMap } from "./StoryCircuitMap";
import { StorySidebar } from "./internal/StorySidebar";
import { createStorySceneStore, StorySceneStore } from "./internal/story-scene-store";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";

interface IStorySceneProps {
  runtime: IStoryMapRuntimeData;
  briefing: IStoryChapterBriefing;
}

export function StoryScene({ runtime, briefing }: IStorySceneProps) {
  const router = useRouter();
  const [store] = useState<StorySceneStore>(() =>
    createStorySceneStore({
      nodes: runtime.nodes,
      currentNodeId: runtime.currentNodeId,
      history: runtime.history,
    }),
  );
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const setHistory = useStore(store, (state) => state.setHistory);
  const [isMoving, setIsMoving] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const primaryAction = resolveStoryPrimaryAction(selectedNode);

  const handleMove = async () => {
    if (!selectedNodeId || isMoving) return;
    setIsMoving(true);
    setMovementError(null);
    setInteractionFeedback(null);
    try {
      const response = await fetch("/api/story/world/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: selectedNodeId }),
      });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as {
        currentNodeId: string | null;
        history: IStoryMapRuntimeData["history"];
      };
      setCurrentNodeId(payload.currentNodeId);
      setHistory(payload.history);
      await new Promise((resolve) => setTimeout(resolve, 850));
    } catch {
      setMovementError("No se pudo mover al nodo seleccionado.");
    } finally {
      setIsMoving(false);
    }
  };

  const handlePrimaryAction = () => {
    if (!selectedNode) return;
    setInteractionFeedback(null);
    if (primaryAction.mode === "ROUTE") {
      router.push(selectedNode.href);
      return;
    }
    if (primaryAction.mode === "VIRTUAL_INTERACTION") {
      setInteractionFeedback(`Interacción completada: ${selectedNode.title}.`);
    }
  };

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <div className="z-20 w-80 flex-shrink-0 border-r border-cyan-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:w-96">
        <StorySidebar
          briefing={briefing}
          selectedNode={selectedNode}
          canMove={Boolean(
            selectedNode &&
              selectedNode.isUnlocked &&
              !selectedNode.isVirtualNode &&
              selectedNode.id !== currentNodeId,
          )}
          isMoving={isMoving}
          movementError={movementError}
          interactionFeedback={interactionFeedback}
          primaryActionLabel={primaryAction.label}
          canRunPrimaryAction={primaryAction.isEnabled}
          onMove={handleMove}
          onPrimaryAction={handlePrimaryAction}
          onDeselect={() => setSelectedNodeId(null)}
        />
      </div>

      <div className="relative z-0 flex-1 overflow-hidden bg-[#050810]">
        <StoryCircuitMap
          nodes={runtime.nodes}
          currentNodeId={currentNodeId}
          selectedNodeId={selectedNodeId}
          isInteractionLocked={isMoving}
          onSelectNode={setSelectedNodeId}
        />
      </div>
    </div>
  );
}

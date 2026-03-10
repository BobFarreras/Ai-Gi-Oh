// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StoryCircuitMap } from "./StoryCircuitMap";
import { StoryNodeInteractionDialog } from "./internal/StoryNodeInteractionDialog";
import { StorySidebar } from "./internal/StorySidebar";
import { useStoryAutoNodeSelection } from "./internal/use-story-auto-node-selection";
import { createStorySceneStore, StorySceneStore } from "./internal/story-scene-store";
import { useStoryNodeInteractionDialog } from "./internal/use-story-node-interaction-dialog";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";

interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; }
interface IStoryInteractResponse { history: IStoryMapRuntimeData["history"]; interactionCountForNode: number; }

export function StoryScene({ runtime, briefing }: IStorySceneProps) {
  const router = useRouter();
  const [store] = useState<StorySceneStore>(() => createStorySceneStore({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId, history: runtime.history }));
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const setHistory = useStore(store, (state) => state.setHistory);
  const [isMoving, setIsMoving] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const interactionDialog = useStoryNodeInteractionDialog();
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const isBusy = isMoving || isInteracting || interactionDialog.isOpen;

  const handleMove = async () => {
    if (!selectedNodeId || isMoving) return;
    setIsMoving(true); setMovementError(null); setInteractionFeedback(null);
    try {
      const response = await fetch("/api/story/world/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: selectedNodeId }) });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as { currentNodeId: string | null; history: IStoryMapRuntimeData["history"] };
      setCurrentNodeId(payload.currentNodeId); setHistory(payload.history); await new Promise((resolve) => setTimeout(resolve, 850));
    } catch { setMovementError("No se pudo mover al nodo seleccionado."); } finally { setIsMoving(false); }
  };

  const handlePrimaryAction = async () => {
    if (!selectedNode) return;
    setInteractionFeedback(null);
    if (primaryAction.mode === "ROUTE") { router.push(selectedNode.href); return; }
    if (primaryAction.mode !== "VIRTUAL_INTERACTION") return;
    try {
      setIsInteracting(true);
      const response = await fetch("/api/story/world/interact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: selectedNode.id }) });
      if (!response.ok) throw new Error("Interacción inválida.");
      const payload = (await response.json()) as IStoryInteractResponse;
      setHistory(payload.history);
      const opened = interactionDialog.start(selectedNode, payload.interactionCountForNode);
      setInteractionFeedback(opened ? `Interacción iniciada: ${selectedNode.title}.` : `Interacción completada: ${selectedNode.title}.`);
    } catch { setInteractionFeedback("No se pudo registrar la interacción narrativa."); } finally { setIsInteracting(false); }
  };

  useStoryAutoNodeSelection({ selectedNode, currentNodeId, isBusy, onAutoMove: () => void handleMove(), onAutoInteract: () => void handlePrimaryAction() });

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <div className="z-20 w-80 flex-shrink-0 border-r border-cyan-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:w-96">
        <StorySidebar
          briefing={briefing}
          selectedNode={selectedNode}
          canMove={Boolean(selectedNode && selectedNode.isUnlocked && !selectedNode.isVirtualNode && selectedNode.id !== currentNodeId && !isInteracting && !interactionDialog.isOpen)}
          isMoving={isBusy}
          movementError={movementError}
          interactionFeedback={interactionFeedback}
          primaryActionLabel={primaryAction.label}
          canRunPrimaryAction={primaryAction.isEnabled && !isBusy}
          onMove={handleMove}
          onPrimaryAction={handlePrimaryAction}
          onDeselect={() => setSelectedNodeId(null)}
        />
      </div>
      <div className="relative z-0 flex-1 overflow-hidden bg-[#050810]">
        <StoryCircuitMap nodes={runtime.nodes} currentNodeId={currentNodeId} selectedNodeId={selectedNodeId} isInteractionLocked={isBusy} onSelectNode={setSelectedNodeId} />
        <StoryNodeInteractionDialog isOpen={interactionDialog.isOpen} title={interactionDialog.dialogueTitle} line={interactionDialog.currentLine} onNext={interactionDialog.next} onClose={interactionDialog.close} />
      </div>
    </div>
  );
}

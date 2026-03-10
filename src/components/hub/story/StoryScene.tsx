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
  const [avatarVisualTarget, setAvatarVisualTarget] = useState<{ nodeId: string; stance: "CENTER" | "SIDE" } | null>(null);
  const [pendingCenterNodeId, setPendingCenterNodeId] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const interactionDialog = useStoryNodeInteractionDialog();
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const isBusy = isMoving || isInteracting || interactionDialog.isOpen;
  const centerAvatarOnNode = async (nodeId: string) => {
    setCurrentNodeId(nodeId); setAvatarVisualTarget({ nodeId, stance: "CENTER" }); await new Promise((resolve) => setTimeout(resolve, 260));
  };

  const handleMove = async (triggerActionAfterMove = false) => {
    if (!selectedNodeId || isMoving) return;
    setIsMoving(true); setMovementError(null); setInteractionFeedback(null);
    if (selectedNode?.isVirtualNode && selectedNode.nodeType === "MOVE") {
      setAvatarVisualTarget({ nodeId: selectedNode.id, stance: "SIDE" }); await new Promise((resolve) => setTimeout(resolve, 420)); await centerAvatarOnNode(selectedNode.id);
      setInteractionFeedback(`Desplazamiento completado: ${selectedNode.title}.`);
      await new Promise((resolve) => setTimeout(resolve, 550));
      setIsMoving(false); setAvatarVisualTarget(null);
      return;
    }
    try {
      const response = await fetch("/api/story/world/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: selectedNodeId }) });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as { currentNodeId: string | null; history: IStoryMapRuntimeData["history"] };
      if (payload.currentNodeId) { setAvatarVisualTarget({ nodeId: payload.currentNodeId, stance: "SIDE" }); await new Promise((resolve) => setTimeout(resolve, 420)); await centerAvatarOnNode(payload.currentNodeId); }
      setHistory(payload.history); await new Promise((resolve) => setTimeout(resolve, 420));
      if (triggerActionAfterMove && selectedNode && selectedNode.nodeType !== "MOVE") await handlePrimaryAction(selectedNode);
    } catch { setMovementError("No se pudo mover al nodo seleccionado."); } finally { setIsMoving(false); }
  };

  const handlePrimaryAction = async (targetNode = selectedNode) => {
    if (!targetNode) return;
    setInteractionFeedback(null);
    const targetMode = resolveStoryPrimaryAction(targetNode);
    if (targetMode.mode === "DISABLED") return;
    setAvatarVisualTarget({ nodeId: targetNode.id, stance: "SIDE" }); await new Promise((resolve) => setTimeout(resolve, 420));
    if (targetMode.mode === "ROUTE") { await centerAvatarOnNode(targetNode.id); router.push(targetNode.href); return; }
    if (targetMode.mode !== "VIRTUAL_INTERACTION") return;
    try {
      setIsInteracting(true);
      const response = await fetch("/api/story/world/interact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: targetNode.id }) });
      if (!response.ok) throw new Error("Interacción inválida.");
      const payload = (await response.json()) as IStoryInteractResponse;
      setHistory(payload.history);
      const opened = interactionDialog.start(targetNode, payload.interactionCountForNode);
      setPendingCenterNodeId(targetNode.id);
      setInteractionFeedback(opened ? `Interacción iniciada: ${targetNode.title}.` : `Interacción completada: ${targetNode.title}.`);
    } catch { setInteractionFeedback("No se pudo registrar la interacción narrativa."); } finally { setIsInteracting(false); }
  };

  useStoryAutoNodeSelection({ selectedNode, currentNodeId, isBusy, onAutoMove: () => void handleMove(true), onAutoInteract: () => void handlePrimaryAction() });

  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <div className="z-20 w-80 flex-shrink-0 border-r border-cyan-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:w-96">
        <StorySidebar
          briefing={briefing}
          selectedNode={selectedNode}
          canMove={Boolean(
            selectedNode &&
              selectedNode.isUnlocked &&
              (selectedNode.nodeType === "MOVE" || !selectedNode.isVirtualNode) &&
              selectedNode.id !== currentNodeId &&
              !isInteracting &&
              !interactionDialog.isOpen,
          )}
          isMoving={isBusy}
          movementError={movementError}
          interactionFeedback={interactionFeedback}
          primaryActionLabel={primaryAction.label}
          canRunPrimaryAction={primaryAction.isEnabled && !isBusy}
          onMove={() => void handleMove(false)}
          onPrimaryAction={() => void handlePrimaryAction()}
          onDeselect={() => setSelectedNodeId(null)}
        />
      </div>
      <div className="relative z-0 flex-1 overflow-hidden bg-[#050810]">
        <StoryCircuitMap nodes={runtime.nodes} currentNodeId={currentNodeId} selectedNodeId={selectedNodeId} avatarVisualTarget={avatarVisualTarget} isInteractionLocked={isBusy} onSelectNode={setSelectedNodeId} />
        <StoryNodeInteractionDialog
          isOpen={interactionDialog.isOpen}
          title={interactionDialog.dialogueTitle}
          line={interactionDialog.currentLine}
          onNext={interactionDialog.next}
          onClose={async () => { interactionDialog.close(); if (pendingCenterNodeId) { await centerAvatarOnNode(pendingCenterNodeId); setPendingCenterNodeId(null); setAvatarVisualTarget(null); } }}
        />
      </div>
    </div>
  );
}

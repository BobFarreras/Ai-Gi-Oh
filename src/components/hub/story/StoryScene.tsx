// src/components/hub/story/StoryScene.tsx - Escena cliente del mapa Story con selección de nodos e historial desacoplado.
"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "zustand";
import { StoryCircuitMap } from "@/components/hub/story/StoryCircuitMap";
import { StoryHistoryPanel } from "@/components/hub/story/internal/StoryHistoryPanel";
import { createStorySceneStore, StorySceneStore } from "@/components/hub/story/internal/story-scene-store";
import { resolveStoryNodeInteraction } from "@/core/services/story/world/resolve-story-node-interaction";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";

interface StorySceneProps {
  runtime: IStoryMapRuntimeData;
}

export function StoryScene({ runtime }: StorySceneProps) {
  const [store] = useState<StorySceneStore>(() =>
    createStorySceneStore({
      nodes: runtime.nodes,
      currentNodeId: runtime.currentNodeId,
      history: runtime.history,
    }),
  );
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const history = useStore(store, (state) => state.history);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const setHistory = useStore(store, (state) => state.setHistory);
  const [isMoving, setIsMoving] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null;
  const selectedNodeInteraction = selectedNode ? resolveStoryNodeInteraction(selectedNode) : null;

  const handleMove = async () => {
    if (!selectedNodeId || isMoving) return;
    setIsMoving(true);
    setMovementError(null);
    try {
      const response = await fetch("/api/story/world/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: selectedNodeId }),
      });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as { currentNodeId: string | null; history: typeof runtime.history };
      setCurrentNodeId(payload.currentNodeId);
      setHistory(payload.history);
    } catch {
      setMovementError("No se pudo mover al nodo seleccionado.");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl space-y-3">
      <StoryCircuitMap
        nodes={runtime.nodes}
        selectedNodeId={selectedNodeId}
        currentNodeId={currentNodeId}
        onSelectNode={setSelectedNodeId}
      />
      {selectedNode ? (
        <article className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3 text-cyan-100">
          <h2 className="text-sm font-black uppercase tracking-wider">{selectedNode.title}</h2>
          <p className="mt-1 text-xs text-slate-300">Oponente: {selectedNode.opponentName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMove}
              disabled={isMoving || selectedNodeId === currentNodeId || !selectedNode.isUnlocked}
              className="rounded border border-cyan-400/50 bg-cyan-950/60 px-3 py-1 text-xs font-black uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isMoving ? "Moviendo..." : "Moverse aquí"}
            </button>
            <Link
              href={selectedNode.href}
              className="rounded border border-emerald-400/50 bg-emerald-950/60 px-3 py-1 text-xs font-black uppercase tracking-wider"
            >
              {selectedNodeInteraction?.actionLabel ?? "Entrar al nodo"}
            </Link>
          </div>
          {movementError ? <p className="mt-2 text-xs text-rose-300">{movementError}</p> : null}
        </article>
      ) : null}
      <StoryHistoryPanel history={history} />
    </section>
  );
}

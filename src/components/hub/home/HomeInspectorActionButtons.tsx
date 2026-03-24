// src/components/hub/home/HomeInspectorActionButtons.tsx - Acciones contextuales mobile del inspector de Arsenal.
"use client";

import { Download, Sparkles, Upload } from "lucide-react";

interface HomeInspectorActionButtonsProps {
  source: "DECK" | "COLLECTION" | "NONE";
  canInsert: boolean;
  canRemove: boolean;
  canEvolve: boolean;
  evolveCost: number | null;
  pendingAction: "INSERT" | "REMOVE" | "EVOLVE" | null;
  onInsert: () => void;
  onRemove: () => void;
  onEvolve: () => void;
  tutorialHighlightTargetId?: string | null;
}

const actionButtonClass =
  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition";

export function HomeInspectorActionButtons({
  source,
  canInsert,
  canRemove,
  canEvolve,
  evolveCost,
  pendingAction,
  onInsert,
  onRemove,
  onEvolve,
  tutorialHighlightTargetId = null,
}: HomeInspectorActionButtonsProps) {
  if (source === "NONE") return null;
  const showEvolve = source === "COLLECTION";
  const layoutClass = showEvolve ? "grid grid-cols-2" : "grid grid-cols-1";
  const isBusy = pendingAction !== null;
  const canInsertNow = canInsert && !isBusy;
  const canRemoveNow = canRemove && !isBusy;
  const canEvolveNow = canEvolve && !isBusy;
  const addHighlightClass =
    tutorialHighlightTargetId === "tutorial-home-add-button"
      ? "ring-2 ring-cyan-300/95 shadow-[0_0_16px_rgba(34,211,238,0.65)]"
      : "";
  const removeHighlightClass =
    tutorialHighlightTargetId === "tutorial-home-remove-button"
      ? "ring-2 ring-cyan-300/95 shadow-[0_0_16px_rgba(34,211,238,0.65)]"
      : "";
  const evolveHighlightClass =
    tutorialHighlightTargetId === "tutorial-home-evolve-button"
      ? "ring-2 ring-cyan-300/95 shadow-[0_0_16px_rgba(34,211,238,0.65)]"
      : "";

  return (
    <div className={`mt-auto gap-2 pt-3 ${layoutClass}`}>
      {source === "COLLECTION" ? (
        <button
          type="button"
          data-tutorial-id="tutorial-home-add-button"
          aria-label="Añadir carta al deck"
          disabled={!canInsertNow}
          onClick={onInsert}
          className={`${actionButtonClass} ${addHighlightClass} ${
            canInsertNow
              ? "border-cyan-500/60 bg-cyan-950/35 text-cyan-200"
              : "border-zinc-800 bg-zinc-950/55 text-zinc-600"
          }`}
        >
          <Upload size={14} />
          {pendingAction === "INSERT" ? "Añadiendo..." : "Añadir"}
        </button>
      ) : (
        <button
          type="button"
          data-tutorial-id="tutorial-home-remove-button"
          aria-label="Remover carta del deck"
          disabled={!canRemoveNow}
          onClick={onRemove}
          className={`${actionButtonClass} ${removeHighlightClass} ${
            canRemoveNow
              ? "border-red-500/55 bg-red-950/35 text-red-200"
              : "border-zinc-800 bg-zinc-950/55 text-zinc-600"
          }`}
        >
          <Download size={14} />
          {pendingAction === "REMOVE" ? "Removiendo..." : "Remover"}
        </button>
      )}
      {showEvolve ? (
        <button
          type="button"
          data-tutorial-id="tutorial-home-evolve-button"
          aria-label="Evolucionar carta seleccionada"
          disabled={!canEvolveNow}
          onClick={onEvolve}
          className={`${actionButtonClass} ${evolveHighlightClass} ${
            canEvolveNow
              ? "border-amber-400/60 bg-amber-900/30 text-amber-100"
              : "border-zinc-800 bg-zinc-950/55 text-zinc-600"
          }`}
        >
          <Sparkles size={14} />
          {pendingAction === "EVOLVE" ? "Evolucionando..." : canEvolve && evolveCost ? `Evol (${evolveCost})` : "Evolución"}
        </button>
      ) : null}
    </div>
  );
}

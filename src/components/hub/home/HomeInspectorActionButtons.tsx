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
}: HomeInspectorActionButtonsProps) {
  if (source === "NONE") return null;
  const showEvolve = source === "COLLECTION";
  const layoutClass = showEvolve ? "grid grid-cols-2" : "grid grid-cols-1";
  const isBusy = pendingAction !== null;
  const canInsertNow = canInsert && !isBusy;
  const canRemoveNow = canRemove && !isBusy;
  const canEvolveNow = canEvolve && !isBusy;

  return (
    <div className={`mt-auto gap-2 pt-3 ${layoutClass}`}>
      {source === "COLLECTION" ? (
        <button
          type="button"
          aria-label="Añadir carta al deck"
          disabled={!canInsertNow}
          onClick={onInsert}
          className={`${actionButtonClass} ${
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
          aria-label="Remover carta del deck"
          disabled={!canRemoveNow}
          onClick={onRemove}
          className={`${actionButtonClass} ${
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
          aria-label="Evolucionar carta seleccionada"
          disabled={!canEvolveNow}
          onClick={onEvolve}
          className={`${actionButtonClass} ${
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

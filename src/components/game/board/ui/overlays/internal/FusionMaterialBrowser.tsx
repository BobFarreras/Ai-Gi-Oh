// src/components/game/board/ui/overlays/internal/FusionMaterialBrowser.tsx - Overlay para seleccionar materiales de fusión desde un listado claro de entidades del tablero.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";
import { cn } from "@/lib/utils";

export interface IFusionMaterialCandidate {
  instanceId: string;
  card: ICard;
  mode: "ATTACK" | "DEFENSE" | "SET" | "ACTIVATE";
  isSelected: boolean;
  isSelectable: boolean;
}

interface FusionMaterialBrowserProps {
  isOpen: boolean;
  candidates: IFusionMaterialCandidate[];
  selectedCount: number;
  onSelectMaterial: (instanceId: string) => void;
}

export function FusionMaterialBrowser({ isOpen, candidates, selectedCount, onSelectMaterial }: FusionMaterialBrowserProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[182] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className="w-[92%] max-w-5xl max-h-[74vh] rounded-2xl border border-cyan-500/45 bg-zinc-950/95 p-4 shadow-[0_0_60px_rgba(6,182,212,0.2)]"
          >
            <div className="mb-4 border-b border-zinc-700/70 pb-3">
              <h3 className="text-lg font-black uppercase tracking-wider text-cyan-200">Materiales de Fusión</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Selecciona 2 materiales ({selectedCount}/2)
              </p>
            </div>
            <div className="grid max-h-[59vh] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3 lg:grid-cols-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/70 [&::-webkit-scrollbar-track]:bg-transparent">
              {candidates.map((candidate) => (
                <button
                  key={candidate.instanceId}
                  type="button"
                  aria-label={`Material ${candidate.card.name}`}
                  disabled={!candidate.isSelectable && !candidate.isSelected}
                  onClick={() => onSelectMaterial(candidate.instanceId)}
                  className={cn(
                    "rounded-xl border p-2 text-left transition-colors",
                    candidate.isSelected
                      ? "border-amber-300/80 bg-amber-950/35 shadow-[0_0_16px_rgba(251,191,36,0.2)]"
                      : candidate.isSelectable
                        ? "border-cyan-400/55 bg-zinc-900/80 shadow-[0_0_14px_rgba(34,211,238,0.2)] hover:border-cyan-300 hover:bg-zinc-900"
                        : "cursor-not-allowed border-zinc-700/50 bg-zinc-900/45 opacity-45",
                  )}
                >
                  <div className="flex h-[160px] items-center justify-center overflow-hidden rounded-lg border border-zinc-800/80 bg-black/55">
                    <div className="origin-center scale-[0.4]">
                      <Card card={candidate.card} />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[11px] font-bold text-white">{candidate.card.name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase text-zinc-400">{candidate.mode}</p>
                    <p className="text-[10px] font-bold text-amber-300">C{candidate.card.cost}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

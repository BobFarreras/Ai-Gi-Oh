// src/components/hub/ranking/RankingScoringHelpDialog.tsx - Hoja de ayuda contextual con las reglas de
// puntuación del tablero de ranking activo. Los datos salen de la fuente única `ranking-scoring`.
"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { IRankingScoringGuide } from "@/services/ranking/ranking-scoring";

interface RankingScoringHelpDialogProps {
  guide: IRankingScoringGuide;
  onClose: () => void;
}

export function RankingScoringHelpDialog({ guide, onClose }: RankingScoringHelpDialogProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Cómo puntúa ${guide.title}`}
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-400/40 bg-[#04121d]/95 p-6 shadow-[0_0_40px_rgba(34,211,238,0.15)]"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ayuda"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-cyan-100"
        >
          <X size={18} />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-400/80">{guide.cadence}</p>
        <h3 className="mt-1 pr-8 text-2xl font-black text-white">{guide.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{guide.summary}</p>
        <ul className="mt-4 space-y-2">
          {guide.rules.map((rule) => (
            <li
              key={rule.action}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/70 bg-slate-950/50 px-3 py-2"
            >
              <span className="text-sm text-slate-200">{rule.action}</span>
              <span className="shrink-0 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-sm font-black text-cyan-200">
                {rule.points}
              </span>
            </li>
          ))}
        </ul>
        {guide.resetNote ? <p className="mt-4 text-xs leading-5 text-slate-400">{guide.resetNote}</p> : null}
        {guide.prizes ? <p className="mt-1 text-xs font-semibold text-amber-300/80">{guide.prizes}</p> : null}
      </motion.div>
    </motion.div>
  );
}

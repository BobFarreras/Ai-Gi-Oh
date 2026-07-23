// src/components/admin/internal/shared/OpponentCombatSkillEditor.tsx - Editor COMPACTO e inline de las
// habilidades de combate de un oponente (LP/energía), pensado para embeber en un contenedor existente (fila de
// tier de arena, toolbar de story). Cada stat es un mini-stepper con el bonus resultante en vivo.
"use client";

import { cn } from "@/lib/utils";
import { OpponentSkillTargetType } from "@/core/entities/progression/IOpponentSkillRank";
import { useOpponentSkills } from "@/components/admin/internal/shared/use-opponent-skills";

interface IOpponentCombatSkillEditorProps {
  opponentId: string | null;
  opponentType: OpponentSkillTargetType;
  /** Clases del contenedor para encajar en el layout del padre. */
  className?: string;
}

/** Etiqueta corta por tipo de efecto (el nombre del nodo es demasiado largo para inline). */
const SHORT_LABEL: Record<string, string> = {
  STARTING_LP_BONUS: "LP",
  MAX_ENERGY_BONUS: "En.máx",
  TURN1_ENERGY_BONUS: "En.T1",
};

const STEP_BTN =
  "flex h-5 w-5 items-center justify-center rounded border border-slate-600 text-[12px] font-black leading-none text-slate-200 hover:bg-slate-800 disabled:opacity-30";

export function OpponentCombatSkillEditor({ opponentId, opponentType, className }: IOpponentCombatSkillEditorProps) {
  const { nodes, ranks, loading, error, setRank } = useOpponentSkills(opponentId, opponentType);
  if (!opponentId) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Habilidades</span>
      {error ? <span className="text-[10px] font-semibold text-rose-300">{error}</span> : null}
      {loading && nodes.length === 0 ? <span className="text-[10px] text-slate-400">…</span> : null}
      {nodes.map((node) => {
        const rank = ranks.get(node.id) ?? 0;
        const total = node.perRank * rank;
        const label = SHORT_LABEL[node.kind] ?? node.name;
        return (
          <div key={node.id} className="flex items-center gap-1 rounded border border-slate-700/60 bg-slate-950/50 px-1.5 py-1" title={`${node.name} — ${node.blurb}`}>
            <span className="text-[10px] font-bold text-slate-200">{label}</span>
            <button type="button" aria-label={`Bajar ${label}`} className={STEP_BTN} disabled={rank <= 0} onClick={() => void setRank(node.id, Math.max(0, rank - 1))}>−</button>
            <span className="w-7 text-center text-[10px] font-mono font-black text-cyan-200">{rank}/{node.maxRank}</span>
            <button type="button" aria-label={`Subir ${label}`} className={STEP_BTN} disabled={rank >= node.maxRank} onClick={() => void setRank(node.id, Math.min(node.maxRank, rank + 1))}>+</button>
            <span className={`w-9 text-[10px] font-mono ${rank > 0 ? "text-emerald-300" : "text-slate-600"}`}>{rank > 0 ? `+${total}` : "·"}</span>
          </div>
        );
      })}
    </div>
  );
}

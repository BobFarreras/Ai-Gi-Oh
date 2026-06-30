// src/components/admin/internal/arena/AdminArenaTierRow.tsx - Editor inline de un tier de arena (dificultad, desbloqueo, recompensa, oponente).
"use client";

import { useState } from "react";
import { IAdminArenaOpponent, IAdminArenaTier } from "@/core/entities/training/IAdminArena";

interface IAdminArenaTierRowProps {
  tier: IAdminArenaTier;
  opponents: IAdminArenaOpponent[];
  isBusy: boolean;
  onSave: (tier: IAdminArenaTier) => void;
  onDelete: (tier: number) => void;
}

const DIFFICULTIES = ["EASY", "NORMAL", "HARD", "BOSS", "MASTER", "MYTHIC"];
const FIELD = "h-7 rounded border border-slate-600 bg-slate-950/70 px-1.5 text-[11px] text-slate-100";

export function AdminArenaTierRow({ tier, opponents, isBusy, onSave, onDelete }: IAdminArenaTierRowProps) {
  const [draft, setDraft] = useState<IAdminArenaTier>(tier);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-950/40 p-2">
      <span className="w-8 text-center text-sm font-black text-cyan-200">T{draft.tier}</span>
      <input aria-label="Código del tier" className={`${FIELD} w-20`} placeholder="Código" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
      <select aria-label="Dificultad IA" className={`${FIELD} w-24`} value={draft.aiDifficulty} onChange={(event) => setDraft({ ...draft, aiDifficulty: event.target.value })}>
        {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
      </select>
      <label className="flex items-center gap-1 text-[10px] text-slate-400">Victorias
        <input aria-label="Victorias para desbloquear" className={`${FIELD} w-12`} inputMode="numeric" value={draft.requiredWinsInPreviousTier} onChange={(event) => setDraft({ ...draft, requiredWinsInPreviousTier: Number(event.target.value) || 0 })} />
      </label>
      <label className="flex items-center gap-1 text-[10px] text-slate-400">Recompensa
        <input aria-label="Multiplicador de recompensa" className={`${FIELD} w-14`} inputMode="decimal" value={draft.rewardMultiplier} onChange={(event) => setDraft({ ...draft, rewardMultiplier: Number(event.target.value) || 0 })} />
      </label>
      <select aria-label="Oponente del tier" className={`${FIELD} min-w-0 flex-1`} value={draft.opponentId} onChange={(event) => setDraft({ ...draft, opponentId: event.target.value })}>
        {opponents.map((opponent) => <option key={opponent.id} value={opponent.id}>{opponent.displayName} ({opponent.id})</option>)}
      </select>
      <label className="flex items-center gap-1 text-[11px] text-slate-300"><input type="checkbox" aria-label="Tier activo" checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /> Activo</label>
      <button type="button" aria-label="Guardar tier" disabled={isBusy} className="h-7 rounded border border-emerald-600/60 bg-emerald-950/40 px-3 text-[10px] font-black uppercase text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50" onClick={() => onSave(draft)}>Guardar</button>
      <button type="button" aria-label="Eliminar tier" disabled={isBusy} className="h-7 w-7 rounded border border-rose-700/50 text-[12px] text-rose-300 hover:bg-rose-900/40 disabled:opacity-50" onClick={() => onDelete(draft.tier)}>×</button>
    </div>
  );
}

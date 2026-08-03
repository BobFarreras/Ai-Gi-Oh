// src/components/admin/internal/pve/AdminSurvivalRosterEditor.tsx - Roster visual de la expedición: quién sale y en qué orden.
"use client";

import Image from "next/image";
import { IAdminPveArenaOpponentRef } from "@/core/entities/admin/IAdminPveModes";
import { PVE_DANGER_BUTTON, PVE_FIELD, PVE_GHOST_BUTTON } from "@/components/admin/internal/pve/admin-pve-styles";

interface IAdminSurvivalRosterEditorProps {
  roster: string[];
  arenaOpponents: IAdminPveArenaOpponentRef[];
  onChange: (roster: string[]) => void;
}

function move(roster: string[], index: number, delta: number): string[] {
  const target = index + delta;
  if (target < 0 || target >= roster.length) return roster;
  const next = [...roster];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * El orden importa: el combate N enfrenta al rival `N % roster`. Verlo con caras evita el clásico error de
 * poner al rival final en la primera posición sin darse cuenta.
 */
export function AdminSurvivalRosterEditor({ roster, arenaOpponents, onChange }: IAdminSurvivalRosterEditorProps) {
  const byId = new Map(arenaOpponents.map((opponent) => [opponent.id, opponent] as const));
  const available = arenaOpponents.filter((opponent) => !roster.includes(opponent.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          Añadir rival
          <select
            aria-label="Añadir rival al roster"
            className={`${PVE_FIELD} w-48`}
            value=""
            onChange={(event) => event.target.value && onChange([...roster, event.target.value])}
          >
            <option value="">— elige rival —</option>
            {available.map((opponent) => (
              <option key={opponent.id} value={opponent.id}>{opponent.displayName}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          aria-label="Rellenar el roster con todos los rivales activos"
          className={PVE_GHOST_BUTTON}
          disabled={available.length === 0}
          onClick={() => onChange([...roster, ...available.map((opponent) => opponent.id)])}
        >
          + Todos ({available.length})
        </button>
        <span className="text-[10px] text-slate-500">{roster.length} rivales · una vuelta completa dura {roster.length || "—"} combates</span>
      </div>

      {roster.length === 0 ? (
        <p className="rounded border border-dashed border-slate-700/60 p-3 text-center text-[11px] text-slate-500">
          Sin rivales no hay expedición. Añade al menos uno.
        </p>
      ) : (
        <ol className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {roster.map((opponentId, index) => {
            const opponent = byId.get(opponentId);
            return (
              <li
                key={`${opponentId}-${index}`}
                className={`flex items-center gap-2 rounded-lg border p-1.5 ${
                  opponent ? "border-slate-700/60 bg-slate-950/50" : "border-rose-700/60 bg-rose-950/25"
                }`}
              >
                <span className="w-5 shrink-0 text-center text-[10px] font-black text-amber-300">{index + 1}</span>
                {opponent?.avatarUrl ? (
                  <Image src={opponent.avatarUrl} alt="" width={32} height={32} unoptimized
                    className="h-8 w-8 shrink-0 rounded-md border border-slate-700/60 object-cover" />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rose-700/60 text-[10px] text-rose-300">?</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold text-slate-200">{opponent?.displayName ?? opponentId}</span>
                  {!opponent ? <span className="block text-[9px] text-rose-300">No existe en Arena</span> : null}
                </span>
                <button type="button" aria-label={`Subir a ${opponent?.displayName ?? opponentId}`} className={`${PVE_GHOST_BUTTON} w-7 px-0`}
                  disabled={index === 0} onClick={() => onChange(move(roster, index, -1))}>↑</button>
                <button type="button" aria-label={`Bajar a ${opponent?.displayName ?? opponentId}`} className={`${PVE_GHOST_BUTTON} w-7 px-0`}
                  disabled={index === roster.length - 1} onClick={() => onChange(move(roster, index, 1))}>↓</button>
                <button type="button" aria-label={`Quitar a ${opponent?.displayName ?? opponentId} del roster`} className={PVE_DANGER_BUTTON}
                  onClick={() => onChange(roster.filter((_, position) => position !== index))}>×</button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

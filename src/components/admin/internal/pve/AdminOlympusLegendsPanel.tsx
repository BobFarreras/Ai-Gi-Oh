// src/components/admin/internal/pve/AdminOlympusLegendsPanel.tsx - Gestión de leyendas: selección, identidad, recompensas y deck en un solo guardado.
"use client";

import { useState } from "react";
import { IUpsertOlympusLegendCommand } from "@/core/entities/admin/IAdminPveModes";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminOlympusLegendDeckEditor } from "@/components/admin/internal/pve/AdminOlympusLegendDeckEditor";
import { AdminOlympusLegendForm } from "@/components/admin/internal/pve/AdminOlympusLegendForm";
import { createEmptyLegend, useOlympusLegendDraft } from "@/components/admin/internal/pve/use-olympus-legend-draft";
import {
  PVE_DANGER_BUTTON, PVE_GHOST_BUTTON, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

export function AdminOlympusLegendsPanel({ modes }: { modes: AdminPveModes }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingLegend, setPendingLegend] = useState<IUpsertOlympusLegendCommand | null>(null);
  const stored = modes.legends.find((legend) => legend.id === selectedId) ?? modes.legends[0] ?? null;
  const selected = pendingLegend ?? stored;
  const draft = useOlympusLegendDraft(selected, modes.validCards);

  const startNewLegend = () => {
    const created = createEmptyLegend(modes.legends.length + 1);
    setPendingLegend(created);
    setSelectedId(created.id);
    draft.discard();
  };
  const selectLegend = (id: string) => {
    setPendingLegend(null);
    setSelectedId(id);
    draft.discard();
  };

  return (
    <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <section className={PVE_SECTION}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className={PVE_TITLE}>Leyendas ({modes.legends.length})</h2>
          <button type="button" aria-label="Crear leyenda nueva" className={PVE_GHOST_BUTTON} disabled={modes.isBusy} onClick={startNewLegend}>
            + Leyenda
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {modes.legends.map((legend) => {
            const isSelected = legend.id === selected?.id;
            return (
              <button
                key={legend.id}
                type="button"
                aria-label={`Editar la leyenda ${legend.displayName}`}
                onClick={() => selectLegend(legend.id)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                  isSelected
                    ? "border-amber-400/60 bg-amber-950/30 text-amber-200"
                    : "border-slate-700/60 bg-slate-950/50 text-slate-300 hover:border-amber-700/50"
                }`}
              >
                <span className="font-bold">{legend.displayName}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">v{legend.version}</span>
                {!legend.isActive ? (
                  <span className="rounded border border-slate-600/60 px-1 text-[9px] uppercase text-slate-400">Inactiva</span>
                ) : null}
              </button>
            );
          })}
          {pendingLegend ? (
            <span className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-2.5 py-1.5 text-[11px] text-emerald-200">
              {pendingLegend.displayName} <span className="text-[9px] uppercase tracking-wider">sin publicar</span>
            </span>
          ) : null}
        </div>
      </section>

      {draft.current ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Guardar leyenda"
              className={PVE_SAVE_BUTTON}
              disabled={modes.isBusy}
              onClick={() => void modes.saveLegend(draft.current!).then((ok) => {
                if (!ok) return;
                setPendingLegend(null);
                setSelectedId(draft.current!.id);
                draft.discard();
              })}
            >
              Guardar leyenda
            </button>
            {draft.hasChanges ? (
              <button type="button" aria-label="Descartar cambios de la leyenda" className={PVE_GHOST_BUTTON} onClick={draft.discard}>Descartar</button>
            ) : null}
            {stored && !pendingLegend ? (
              <button
                type="button"
                aria-label="Retirar leyenda"
                className={PVE_DANGER_BUTTON}
                disabled={modes.isBusy}
                onClick={() => void modes.removeLegend(stored.id).then((ok) => ok && setSelectedId(null))}
              >
                Retirar
              </button>
            ) : null}
            <span className="text-[9.5px] text-slate-500">
              Editar sube la versión de la leyenda; las batallas en curso siguen con el snapshot con el que se emitieron.
            </span>
          </div>

          <AdminOlympusLegendForm legend={draft.current} deckVariantIds={modes.arenaDeckVariantIds} onEdit={draft.edit} />
          <section className={PVE_SECTION}>
            <h3 className={`${PVE_TITLE} mb-2`}>Deck legendario</h3>
            <AdminOlympusLegendDeckEditor draft={draft} validCards={modes.validCards} />
          </section>
        </>
      ) : (
        <p className="text-[11px] text-slate-500">Crea una leyenda para empezar a configurarla.</p>
      )}
    </div>
  );
}

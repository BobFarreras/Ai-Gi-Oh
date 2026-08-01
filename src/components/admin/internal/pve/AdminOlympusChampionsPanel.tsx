// src/components/admin/internal/pve/AdminOlympusChampionsPanel.tsx - Vínculo del campeón con su rival de Arena, escala base y árbol de mejoras.
"use client";

import { useState } from "react";
import { IAdminOlympusChampion, IUpsertOlympusChampionCommand } from "@/core/entities/admin/IAdminPveModes";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminOlympusNodeRow } from "@/components/admin/internal/pve/AdminOlympusNodeRow";
import {
  PVE_FIELD, PVE_GHOST_BUTTON, PVE_LABEL, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

function AdminOlympusChampionCard({ champion, modes }: { champion: IAdminOlympusChampion; modes: AdminPveModes }) {
  const [draft, setDraft] = useState<IUpsertOlympusChampionCommand>(champion);
  const edit = (patch: Partial<IUpsertOlympusChampionCommand>) => setDraft({ ...draft, ...patch });
  const siblingIds = champion.nodes.map((node) => node.id);

  const addNode = () => {
    const index = champion.nodes.length + 1;
    modes.saveNode({
      id: `${champion.id}-node-${index}`, championId: champion.id, branch: "POWER",
      prerequisiteNodeIds: [], effectKind: "GLOBAL_LEVEL", effectAmount: 5, effectCap: 30,
      effectCardIds: [], fragmentCost: 40, sortOrder: index * 10, isActive: false,
    });
  };

  return (
    <section className={PVE_SECTION}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-24 truncate text-[11px] font-black text-amber-200" title={champion.id}>{champion.id}</span>
        <label className={PVE_LABEL}>Rival Arena
          <select aria-label={`Rival de Arena de ${champion.id}`} className={`${PVE_FIELD} w-40`} value={draft.arenaOpponentId}
            onChange={(event) => edit({ arenaOpponentId: event.target.value })}>
            {modes.arenaOpponentIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label className={PVE_LABEL} title="Tier en el que hay que derrotarlo para desbloquearlo">Tier
          <input aria-label={`Tier requerido de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.requiredTier}
            onChange={(event) => edit({ requiredTier: Number(event.target.value) || 1 })} />
        </label>
        <label className={PVE_LABEL}>Ladder
          <input aria-label={`Posición del ladder de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.requiredLadderPosition}
            onChange={(event) => edit({ requiredLadderPosition: Number(event.target.value) || 1 })} />
        </label>
        <label className={PVE_LABEL}>Mazo base
          <select aria-label={`Variante de mazo de ${champion.id}`} className={`${PVE_FIELD} w-40`} value={draft.baseDeckVariantId}
            onChange={(event) => edit({ baseDeckVariantId: event.target.value })}>
            {modes.arenaDeckVariantIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input type="checkbox" aria-label={`Campeón ${champion.id} activo`} checked={draft.isActive} onChange={(event) => edit({ isActive: event.target.checked })} />
          Activo
        </label>
        <button type="button" aria-label={`Guardar campeón ${champion.id}`} className={PVE_SAVE_BUTTON} disabled={modes.isBusy} onClick={() => modes.saveChampion(draft)}>
          Guardar
        </button>
        <span className="text-[9.5px] text-slate-500">v{champion.version}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800/60 pt-2">
        <span className="text-[10px] text-slate-400">Escala base del deck prestado:</span>
        <label className={PVE_LABEL}>Nivel
          <input aria-label={`Nivel base de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.baseLevel}
            onChange={(event) => edit({ baseLevel: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL}>Versión
          <input aria-label={`Versión base de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.baseVersionTier}
            onChange={(event) => edit({ baseVersionTier: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL}>LP
          <input aria-label={`LP iniciales de ${champion.id}`} className={`${PVE_FIELD} w-20`} inputMode="numeric" value={draft.baseStartingLp}
            onChange={(event) => edit({ baseStartingLp: Number(event.target.value) || 0 })} />
        </label>
        <span className="text-[9.5px] text-slate-500">Los nodos comprados suben desde aquí, hasta el tope de cada efecto.</span>
      </div>

      <div className="mt-2 border-t border-slate-800/60 pt-2">
        <div className="mb-1.5 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Árbol ({champion.nodes.length} nodos)</h3>
          <button type="button" aria-label={`Añadir nodo a ${champion.id}`} className={PVE_GHOST_BUTTON} disabled={modes.isBusy} onClick={addNode}>+ Nodo</button>
        </div>
        <div className="space-y-1.5">
          {champion.nodes.map((node) => (
            <AdminOlympusNodeRow
              key={`${node.id}-v${node.version}`}
              node={node}
              siblingIds={siblingIds.filter((id) => id !== node.id)}
              isBusy={modes.isBusy}
              onSave={modes.saveNode}
              onDelete={modes.removeNode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminOlympusChampionsPanel({ modes }: { modes: AdminPveModes }) {
  return (
    <div className="home-modern-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      <p className="text-[10px] text-slate-500">
        El campeón presta el deck real de un rival de Arena. Solo se desbloquea derrotándolo en su tier; el árbol es
        por campeón y se paga con Fragmentos.
      </p>
      <h2 className={PVE_TITLE}>Campeones ({modes.champions.length})</h2>
      {modes.champions.map((champion) => (
        <AdminOlympusChampionCard key={`${champion.id}-v${champion.version}`} champion={champion} modes={modes} />
      ))}
    </div>
  );
}

// src/components/admin/internal/pve/AdminOlympusNodeRow.tsx - Editor inline de un nodo del árbol: rama, efecto, prerrequisitos y coste.
"use client";

import { useState } from "react";
import { IAdminOlympusUpgradeNode, IUpsertOlympusNodeCommand } from "@/core/entities/admin/IAdminPveModes";
import {
  OLYMPUS_UPGRADE_BRANCHES,
  OLYMPUS_UPGRADE_EFFECT_KINDS,
} from "@/core/entities/admin/IAdminPveModes.types";
import {
  PVE_DANGER_BUTTON, PVE_FIELD, PVE_LABEL, PVE_SAVE_BUTTON,
} from "@/components/admin/internal/pve/admin-pve-styles";

interface IAdminOlympusNodeRowProps {
  node: IAdminOlympusUpgradeNode;
  siblingIds: string[];
  isBusy: boolean;
  onSave: (node: IUpsertOlympusNodeCommand) => void;
  onDelete: (id: string) => void;
}

/** Solo `SIGNATURE_CARD_LEVEL` acepta selector; sin él la rama de identidad sube el fusion deck entero. */
const SUPPORTS_SELECTOR = (kind: string): boolean => kind === "SIGNATURE_CARD_LEVEL";

export function AdminOlympusNodeRow({ node, siblingIds, isBusy, onSave, onDelete }: IAdminOlympusNodeRowProps) {
  const [draft, setDraft] = useState<IAdminOlympusUpgradeNode>(node);
  const edit = (patch: Partial<IAdminOlympusUpgradeNode>) => setDraft({ ...draft, ...patch });
  const togglePrerequisite = (id: string) => edit({
    prerequisiteNodeIds: draft.prerequisiteNodeIds.includes(id)
      ? draft.prerequisiteNodeIds.filter((current) => current !== id)
      : [...draft.prerequisiteNodeIds, id],
  });

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-28 truncate text-[10px] font-mono text-slate-500" title={draft.id}>{draft.id}</span>
        <select aria-label={`Rama del nodo ${draft.id}`} className={`${PVE_FIELD} w-28`} value={draft.branch}
          onChange={(event) => edit({ branch: event.target.value as IAdminOlympusUpgradeNode["branch"] })}>
          {OLYMPUS_UPGRADE_BRANCHES.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
        </select>
        <select aria-label={`Efecto del nodo ${draft.id}`} className={`${PVE_FIELD} w-44`} value={draft.effectKind}
          onChange={(event) => edit({ effectKind: event.target.value, effectCardIds: SUPPORTS_SELECTOR(event.target.value) ? draft.effectCardIds : [] })}>
          {OLYMPUS_UPGRADE_EFFECT_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
        </select>
        <label className={PVE_LABEL} title="Cuánto suma el nodo">+
          <input aria-label={`Magnitud del nodo ${draft.id}`} className={`${PVE_FIELD} w-16`} inputMode="numeric" value={draft.effectAmount}
            onChange={(event) => edit({ effectAmount: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL} title="Techo absoluto del atributo, no el incremento">Tope
          <input aria-label={`Tope del nodo ${draft.id}`} className={`${PVE_FIELD} w-20`} inputMode="numeric" value={draft.effectCap}
            onChange={(event) => edit({ effectCap: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL}>Coste
          <input aria-label={`Coste del nodo ${draft.id}`} className={`${PVE_FIELD} w-16`} inputMode="numeric" value={draft.fragmentCost}
            onChange={(event) => edit({ fragmentCost: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL}>Orden
          <input aria-label={`Orden del nodo ${draft.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.sortOrder}
            onChange={(event) => edit({ sortOrder: Number(event.target.value) || 0 })} />
        </label>
        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input type="checkbox" aria-label={`Nodo ${draft.id} activo`} checked={draft.isActive} onChange={(event) => edit({ isActive: event.target.checked })} />
          Activo
        </label>
        <button type="button" aria-label={`Guardar nodo ${draft.id}`} className={PVE_SAVE_BUTTON} disabled={isBusy} onClick={() => onSave(draft)}>Guardar</button>
        <button type="button" aria-label={`Retirar nodo ${draft.id}`} className={PVE_DANGER_BUTTON} disabled={isBusy} onClick={() => onDelete(draft.id)}>×</button>
      </div>

      {SUPPORTS_SELECTOR(draft.effectKind) ? (
        <label className="mt-1.5 block text-[10px] text-slate-400">
          Cartas emblemáticas (ids separados por coma; vacío = todo el fusion deck)
          <input
            aria-label={`Selector de cartas del nodo ${draft.id}`}
            className={`${PVE_FIELD} mt-1 w-full`}
            value={draft.effectCardIds.join(", ")}
            onChange={(event) => edit({ effectCardIds: event.target.value.split(",").map((id) => id.trim()).filter(Boolean) })}
          />
        </label>
      ) : null}

      {siblingIds.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 border-t border-slate-800/60 pt-1.5">
          <span className="text-[10px] text-slate-500">Prerrequisitos:</span>
          {siblingIds.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={`Alternar prerrequisito ${id} del nodo ${draft.id}`}
              onClick={() => togglePrerequisite(id)}
              className={`rounded border px-1.5 py-0.5 text-[9.5px] transition ${
                draft.prerequisiteNodeIds.includes(id)
                  ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-200"
                  : "border-slate-700/60 bg-slate-950/60 text-slate-500 hover:text-slate-300"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

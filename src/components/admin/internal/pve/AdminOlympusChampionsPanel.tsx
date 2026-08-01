// src/components/admin/internal/pve/AdminOlympusChampionsPanel.tsx - Vínculo del campeón con su rival de Arena, escala base y árbol de mejoras.
"use client";

import Image from "next/image";
import { useState } from "react";
import { IAdminOlympusChampion, IUpsertOlympusChampionCommand } from "@/core/entities/admin/IAdminPveModes";
import { AdminPveModes } from "@/components/admin/internal/pve/use-admin-pve-modes";
import { AdminOlympusNodeRow } from "@/components/admin/internal/pve/AdminOlympusNodeRow";
import { AdminPveHelpNote } from "@/components/admin/internal/pve/AdminPveHelpNote";
import {
  PVE_FIELD, PVE_GHOST_BUTTON, PVE_LABEL, PVE_SAVE_BUTTON, PVE_SECTION, PVE_TITLE,
} from "@/components/admin/internal/pve/admin-pve-styles";

function AdminOlympusChampionCard({ champion, modes }: { champion: IAdminOlympusChampion; modes: AdminPveModes }) {
  const [draft, setDraft] = useState<IUpsertOlympusChampionCommand>(champion);
  const edit = (patch: Partial<IUpsertOlympusChampionCommand>) => setDraft({ ...draft, ...patch });
  const arenaOpponent = modes.arenaOpponents.find((opponent) => opponent.id === draft.arenaOpponentId) ?? null;
  // El campeón presta el mazo de SU rival: ofrecer variantes de otro rival rompería la emisión del combate.
  const variants = arenaOpponent?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === draft.baseDeckVariantId) ?? null;
  const hasOrphanVariant = draft.baseDeckVariantId !== "" && selectedVariant === null;

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
      <div className="flex flex-wrap items-center gap-2">
        {arenaOpponent?.avatarUrl ? (
          <Image src={arenaOpponent.avatarUrl} alt="" width={40} height={40} unoptimized
            className="h-10 w-10 shrink-0 rounded-lg border border-amber-700/50 object-cover" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-amber-200">{arenaOpponent?.displayName ?? champion.id}</p>
          <p className="truncate text-[9.5px] font-mono text-slate-500">{champion.id} · v{champion.version}</p>
        </div>
        <label className={PVE_LABEL}>Rival de Arena
          <select aria-label={`Rival de Arena de ${champion.id}`} className={`${PVE_FIELD} w-44`} value={draft.arenaOpponentId}
            onChange={(event) => edit({ arenaOpponentId: event.target.value, baseDeckVariantId: "" })}>
            {modes.arenaOpponents.map((opponent) => (
              <option key={opponent.id} value={opponent.id}>{opponent.displayName}</option>
            ))}
          </select>
        </label>
        <label className={PVE_LABEL} title="Debe derrotarlo en este nivel para desbloquearlo">Tier
          <input aria-label={`Tier requerido de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.requiredTier}
            onChange={(event) => edit({ requiredTier: Number(event.target.value) || 1 })} />
        </label>
        <label className={PVE_LABEL} title="Victorias necesarias dentro de ese nivel">Ladder
          <input aria-label={`Posición del ladder de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.requiredLadderPosition}
            onChange={(event) => edit({ requiredLadderPosition: Number(event.target.value) || 1 })} />
        </label>
        <label className="flex items-center gap-1 text-[11px] text-slate-300">
          <input type="checkbox" aria-label={`Campeón ${champion.id} activo`} checked={draft.isActive} onChange={(event) => edit({ isActive: event.target.checked })} />
          Activo
        </label>
        <button type="button" aria-label={`Guardar campeón ${champion.id}`} className={PVE_SAVE_BUTTON} disabled={modes.isBusy} onClick={() => modes.saveChampion(draft)}>
          Guardar
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-2">
        <label className={PVE_LABEL}>Mazo prestado
          <select aria-label={`Variante de mazo de ${champion.id}`} className={`${PVE_FIELD} w-56`} value={draft.baseDeckVariantId}
            onChange={(event) => edit({ baseDeckVariantId: event.target.value })}>
            <option value="">— elige un mazo de {arenaOpponent?.displayName ?? "este rival"} —</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label ?? variant.id} · {variant.deckCount} cartas{variant.fusionCount > 0 ? ` + ${variant.fusionCount} fusión` : ""}
              </option>
            ))}
          </select>
        </label>
        {hasOrphanVariant ? (
          <span className="rounded border border-rose-600/50 bg-rose-950/30 px-2 py-1 text-[10px] text-rose-200">
            «{draft.baseDeckVariantId}» no pertenece a este rival: el combate fallaría al emitirse.
          </span>
        ) : null}
        <label className={PVE_LABEL} title="Nivel de partida de las cartas prestadas">Nivel base
          <input aria-label={`Nivel base de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.baseLevel}
            onChange={(event) => edit({ baseLevel: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL} title="Versión de partida de las cartas prestadas">Versión base
          <input aria-label={`Versión base de ${champion.id}`} className={`${PVE_FIELD} w-12`} inputMode="numeric" value={draft.baseVersionTier}
            onChange={(event) => edit({ baseVersionTier: Number(event.target.value) || 0 })} />
        </label>
        <label className={PVE_LABEL}>LP iniciales
          <input aria-label={`LP iniciales de ${champion.id}`} className={`${PVE_FIELD} w-20`} inputMode="numeric" value={draft.baseStartingLp}
            onChange={(event) => edit({ baseStartingLp: Number(event.target.value) || 0 })} />
        </label>
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
              siblingIds={champion.nodes.map((sibling) => sibling.id).filter((id) => id !== node.id)}
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
      <AdminPveHelpNote
        title="Cómo funciona un campeón"
        steps={[
          "El jugador no juega con su mazo: toma prestado el mazo real de un rival de Arena que ya derrotó.",
          "Se desbloquea al ganarle a ese rival en su tier; la posición del ladder marca cuántas victorias hacen falta.",
          "El mazo prestado sale al «nivel base» y la «versión base» que fijes aquí, no al nivel del jugador.",
          "Los nodos comprados suben desde esa base hasta el tope de cada efecto. Las cartas prestadas no ganan XP ni entran en la colección.",
        ]}
      />
      <h2 className={PVE_TITLE}>Campeones ({modes.champions.length})</h2>
      {modes.champions.map((champion) => (
        <AdminOlympusChampionCard key={`${champion.id}-v${champion.version}`} champion={champion} modes={modes} />
      ))}
    </div>
  );
}

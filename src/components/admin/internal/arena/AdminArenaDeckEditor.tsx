// src/components/admin/internal/arena/AdminArenaDeckEditor.tsx - Editor visual de mazos de arena (4 columnas estilo Story): oponentes, mazo, almacén, detalle.
"use client";

import { useEffect, useState } from "react";
import { IAdminCardUpgradeItemEntry } from "@/core/entities/admin/IAdminShopObjects";
import { fetchAdminShopObjects } from "@/components/admin/admin-objects-api";
import { AdminMobileDetailDialog } from "@/components/admin/internal/AdminMobileDetailDialog";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
import { AdminArenaDeckGrid } from "@/components/admin/internal/arena/AdminArenaDeckGrid";
import { AdminArenaOpponentColumn } from "@/components/admin/internal/arena/AdminArenaOpponentColumn";
import { useAdminArenaDeckEditor } from "@/components/admin/internal/arena/use-admin-arena-deck-editor";

const SCALE_FIELDS: { key: "versionTier" | "level"; label: string; max: number }[] = [
  { key: "versionTier", label: "Ver", max: 5 },
  { key: "level", label: "Lvl", max: 30 },
];

export function AdminArenaDeckEditor() {
  const editor = useAdminArenaDeckEditor();
  const isBusy = editor.arena.status === "saving" || editor.arena.status === "loading";
  const ref = editor.selectedDeckRef;
  const entry = editor.selectedEntry;
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);
  const [upgradeItems, setUpgradeItems] = useState<IAdminCardUpgradeItemEntry[]>([]);

  // Catálogo de objetos de mejora para equipar en las cartas del rival. Fallo → sin picker (edición normal sigue).
  useEffect(() => {
    let active = true;
    fetchAdminShopObjects().then((snapshot) => { if (active) setUpgradeItems(snapshot.upgradeItems); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const equipDisabled = !editor.isEditMode || !ref;

  // Detalle (inspector + escalado) reutilizado en la columna desktop y en el diálogo móvil.
  const detailBody = (
    <>
      <HomeCardInspector
        selectedCard={editor.selectedCard}
        selectedCardVersionTier={entry?.versionTier ?? 0}
        selectedCardLevel={entry?.level ?? 0}
        selectedCardXp={entry?.xp ?? 0}
        selectedCardMasteryPassiveSkillId={null}
        minCardScale={0.55}
        maxCardScale={0.92}
      />
      <section className="rounded-xl border border-cyan-800/30 bg-[#031020]/55 p-3 text-xs text-slate-200">
        <p className="font-black uppercase tracking-[0.18em] text-cyan-300">Escalado de la carta</p>
        <p className="mt-1 text-[10px] text-slate-400">Vacío (0) = usa el escalado del tier. Solo cartas del mazo.</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {SCALE_FIELDS.map((field) => (
            <label key={field.key} className="text-[10px] text-slate-400">
              {field.label}
              <input
                aria-label={`${field.label} de la carta seleccionada`}
                type="number"
                min={0}
                max={field.max}
                value={entry?.[field.key] ?? 0}
                disabled={!editor.isEditMode || !ref}
                onChange={(event) => ref && editor.setOverride(ref.zone, ref.index, field.key, Number(event.target.value) || null)}
                className="mt-1 h-8 w-full rounded-md border border-slate-700/60 bg-slate-950/80 px-2 text-xs text-slate-100 focus:border-cyan-600 focus:outline-none disabled:opacity-50"
              />
            </label>
          ))}
          <label className="text-[10px] text-slate-400">
            XP
            <input
              aria-label="XP de la carta seleccionada"
              type="number"
              min={0}
              value={entry?.xp ?? 0}
              disabled={!editor.isEditMode || !ref}
              onChange={(event) => ref && editor.setOverride(ref.zone, ref.index, "xp", Number(event.target.value) || null)}
              className="mt-1 h-8 w-full rounded-md border border-slate-700/60 bg-slate-950/80 px-2 text-xs text-slate-100 focus:border-cyan-600 focus:outline-none disabled:opacity-50"
            />
          </label>
        </div>
      </section>

      {/* Objetos equipados en la carta del rival: elige objetos del catálogo (apilable) → suman ATK/DEF en combate. */}
      <section className="rounded-xl border border-fuchsia-800/30 bg-[#0a0716]/55 p-3 text-xs text-slate-200">
        <div className="flex items-center justify-between">
          <p className="font-black uppercase tracking-[0.18em] text-fuchsia-300">Objetos equipados</p>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">+{entry?.attackBonus ?? 0} ATK</span>
            <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">+{entry?.defenseBonus ?? 0} DEF</span>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">Cada objeto suma su valor (apilable: p. ej. 4 de ataque + 2 de defensa). Solo cartas del mazo, en modo edición.</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {upgradeItems.length === 0 ? (
            <p className="text-[10px] text-slate-500">No hay objetos de mejora en el catálogo. Créalos en la sección Objetos.</p>
          ) : (
            upgradeItems.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Equipar ${item.name}`}
                disabled={equipDisabled}
                onClick={() => ref && editor.equipObject(ref.zone, ref.index, item.stat, item.value)}
                className="flex h-8 items-center justify-between rounded-md border border-fuchsia-900/50 bg-[#0a0716] px-2.5 text-[11px] text-slate-100 transition hover:border-fuchsia-500 hover:bg-fuchsia-950/40 disabled:opacity-40"
              >
                <span className="truncate">{item.name}</span>
                <span className={`ml-2 shrink-0 font-mono font-bold ${item.stat === "ATTACK" ? "text-rose-300" : "text-sky-300"}`}>+{item.value} {item.stat === "ATTACK" ? "ATK" : "DEF"}</span>
              </button>
            ))
          )}
        </div>
        {((entry?.attackBonus ?? 0) > 0 || (entry?.defenseBonus ?? 0) > 0) ? (
          <button
            type="button"
            disabled={equipDisabled}
            onClick={() => ref && editor.clearObjects(ref.zone, ref.index)}
            className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-500 underline hover:text-slate-300 disabled:opacity-40"
          >
            Quitar objetos
          </button>
        ) : null}
      </section>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/60 bg-[#040d1a]/80 p-2.5">
        <button
          type="button"
          aria-label="Activar o desactivar edición del mazo"
          className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${editor.isEditMode ? "border-amber-500/60 bg-amber-950/40 text-amber-300" : "border-slate-600/60 bg-slate-900/50 text-slate-200 hover:text-cyan-300"}`}
          disabled={isBusy || !editor.variant}
          onClick={() => editor.setIsEditMode(!editor.isEditMode)}
        >
          {editor.isEditMode ? "Salir" : "Editar mazo"}
        </button>
        <button
          type="button"
          aria-label="Añadir carta seleccionada al mazo"
          className="h-8 rounded-md border border-cyan-600/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-900/40 disabled:opacity-40"
          disabled={!editor.isEditMode || !editor.selectedCollectionCardId}
          onClick={() => editor.selectedCollectionCardId && editor.addCard("DECK", editor.selectedCollectionCardId)}
        >
          ↓ Añadir al mazo
        </button>
        <button
          type="button"
          aria-label="Añadir carta seleccionada a fusión"
          className="h-8 rounded-md border border-violet-600/50 bg-violet-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-violet-200 transition hover:bg-violet-900/40 disabled:opacity-40"
          disabled={!editor.isEditMode || !editor.selectedCollectionCardId}
          onClick={() => editor.selectedCollectionCardId && editor.addCard("FUSION", editor.selectedCollectionCardId)}
        >
          ↓ A fusión
        </button>
        <button
          type="button"
          aria-label="Guardar variante de mazo"
          className="h-8 rounded-md border border-emerald-500/70 bg-emerald-950/50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-900/50 disabled:opacity-40"
          disabled={!editor.isEditMode || isBusy || !editor.hasDraft}
          onClick={() => void editor.saveVariant()}
        >
          Guardar
        </button>
        {editor.arena.feedback ? (
          <span className={`ml-auto text-[11px] font-semibold ${editor.arena.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>{editor.arena.feedback}</span>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-2.5 max-xl:flex max-xl:flex-col max-xl:overflow-y-auto xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_330px]">
        <div className="min-h-0 max-xl:h-[38vh] max-xl:shrink-0 xl:contents">
          <AdminArenaOpponentColumn
            opponents={editor.arena.opponents}
            selectedOpponentId={editor.opponent?.id ?? null}
            selectedVariantId={editor.variant?.id ?? null}
            onSelectOpponent={editor.selectOpponent}
            onSelectVariant={editor.selectVariant}
          />
        </div>
        <div className="min-h-0 max-xl:h-[46vh] max-xl:shrink-0 xl:contents">
          <AdminArenaDeckGrid
            deck={editor.deck}
            fusion={editor.fusion}
            cardById={editor.cardById}
            isEditMode={editor.isEditMode}
            selectedRef={editor.selectedDeckRef}
            onSelect={(zone, index) => { editor.selectDeckCard(zone, index); setIsMobileInspectorOpen(true); }}
            onRemove={editor.removeCard}
          />
        </div>
        <div className="min-h-0 max-xl:h-[62vh] max-xl:shrink-0 xl:contents">
          <AdminStarterDeckCollectionPanel
            availableCards={editor.arena.validCards}
            selectedCardId={editor.selectedCollectionCardId}
            isEditMode={editor.isEditMode}
            onSelectCard={(cardId) => { editor.selectCollectionCard(cardId); setIsMobileInspectorOpen(true); }}
            onDropToCollection={(event) => event.preventDefault()}
            onStartDragCard={() => undefined}
          />
        </div>
        {/* Detalle inline solo en desktop; en móvil se abre como diálogo. */}
        <div className="hidden min-h-0 flex-col gap-2 xl:flex">{detailBody}</div>
      </div>

      <AdminMobileDetailDialog isOpen={isMobileInspectorOpen} onClose={() => setIsMobileInspectorOpen(false)} closeAriaLabel="Cerrar detalle de carta">
        <div className="flex h-full min-h-0 flex-col gap-2">
          {editor.isEditMode ? (
            <div className="flex flex-wrap gap-2">
              {editor.selectedCollectionCardId ? (
                <>
                  <button type="button" aria-label="Añadir carta al mazo" className="h-8 rounded-md border border-cyan-600/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-200" onClick={() => { editor.addCard("DECK", editor.selectedCollectionCardId!); setIsMobileInspectorOpen(false); }}>↓ Añadir al mazo</button>
                  <button type="button" aria-label="Añadir carta a fusión" className="h-8 rounded-md border border-violet-600/50 bg-violet-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-violet-200" onClick={() => { editor.addCard("FUSION", editor.selectedCollectionCardId!); setIsMobileInspectorOpen(false); }}>↓ A fusión</button>
                </>
              ) : null}
              {ref ? (
                <button type="button" aria-label="Quitar carta del mazo" className="h-8 rounded-md border border-rose-600/50 bg-rose-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-rose-200" onClick={() => { editor.removeCard(ref.zone, ref.index); setIsMobileInspectorOpen(false); }}>Quitar</button>
              ) : null}
            </div>
          ) : null}
          {detailBody}
        </div>
      </AdminMobileDetailDialog>
    </div>
  );
}

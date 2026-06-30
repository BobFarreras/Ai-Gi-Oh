// src/components/admin/internal/arena/AdminArenaDeckEditor.tsx - Editor visual de mazos de arena (4 columnas estilo Story): oponentes, mazo, almacén, detalle.
"use client";

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

      <div className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_330px]">
        <AdminArenaOpponentColumn
          opponents={editor.arena.opponents}
          selectedOpponentId={editor.opponent?.id ?? null}
          selectedVariantId={editor.variant?.id ?? null}
          onSelectOpponent={editor.selectOpponent}
          onSelectVariant={editor.selectVariant}
        />
        <AdminArenaDeckGrid
          deck={editor.deck}
          fusion={editor.fusion}
          cardById={editor.cardById}
          isEditMode={editor.isEditMode}
          selectedRef={editor.selectedDeckRef}
          onSelect={editor.selectDeckCard}
          onRemove={editor.removeCard}
        />
        <AdminStarterDeckCollectionPanel
          availableCards={editor.arena.validCards}
          selectedCardId={editor.selectedCollectionCardId}
          isEditMode={editor.isEditMode}
          onSelectCard={editor.selectCollectionCard}
          onDropToCollection={(event) => event.preventDefault()}
          onStartDragCard={() => undefined}
        />
        <div className="flex min-h-0 flex-col gap-2">
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
        </div>
      </div>
    </div>
  );
}

// src/components/admin/AdminStoryDeckPanel.tsx - Panel principal para administrar mazos Story por oponente con edición visual y guardado seguro.
"use client";
import { DragEvent, useMemo, useState } from "react";
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { AdminStarterDeckCollectionPanel } from "@/components/admin/internal/AdminStarterDeckCollectionPanel";
import { AdminStoryDeckSlotsPanel } from "@/components/admin/internal/AdminStoryDeckSlotsPanel";
import { AdminStoryDuelCatalog } from "@/components/admin/internal/AdminStoryDuelCatalog";
import { AdminStoryOpponentCatalog } from "@/components/admin/internal/AdminStoryOpponentCatalog";
import { readAdminStarterDeckDragData, writeAdminStarterDeckDragData } from "@/components/admin/internal/admin-starter-deck-dnd";
import { useAdminStoryDeckEditor } from "@/components/admin/internal/use-admin-story-deck-editor";
import { HomeCardInspector } from "@/components/hub/home/HomeCardInspector";
interface IAdminStoryDeckPanelProps {
  initialData: IAdminStoryDeckApiResponse;
}
export function AdminStoryDeckPanel({ initialData }: IAdminStoryDeckPanelProps) {
  const editor = useAdminStoryDeckEditor(initialData);
  const [leftPanelMode, setLeftPanelMode] = useState<"opponents" | "duels">("opponents");
  const [massVersionTier, setMassVersionTier] = useState(0);
  const [massLevel, setMassLevel] = useState(0);
  const [massXp, setMassXp] = useState(0);
  const cardById = useMemo(() => new Map(editor.data.availableCards.map((card) => [card.id, card])), [editor.data.availableCards]);
  const selectedSlotCardId = editor.selectedSlotIndex === null ? null : (editor.draftCardIds[editor.selectedSlotIndex] ?? null);
  const selectedCard = (editor.selectedCollectionCardId ? cardById.get(editor.selectedCollectionCardId) ?? null : null) ?? (selectedSlotCardId ? cardById.get(selectedSlotCardId) ?? null : null);
  const selectedOpponentId = editor.selectedOpponentId;
  const selectedDeckDuels = editor.data.duels.filter((duel) => duel.deckListId === editor.data.deck?.deckListId);
  const cloneCandidateDuels = editor.data.duels.filter((duel) => duel.duelId !== editor.selectedDuelId);
  const [cloneSourceDuelId, setCloneSourceDuelId] = useState<string>("");
  const selectedSlotLevels = editor.selectedSlotIndex === null ? null : (editor.draftSlotLevels[editor.selectedSlotIndex] ?? null);
  function onDropOnSlot(slotIndex: number, event: DragEvent<HTMLElement>): void {
    if (!editor.isEditMode) return;
    event.preventDefault();
    const payload = readAdminStarterDeckDragData(event);
    if (!payload) return;
    if (payload.type === "card") editor.setDraftCardIdBySlot(slotIndex, payload.cardId);
    if (payload.type === "slot" && (payload.scope ?? "DECK") === "DECK" && payload.slotIndex !== slotIndex) editor.swapSlots(payload.slotIndex, slotIndex);
    editor.setSelectedSlotIndex(slotIndex);
  }
  function onInvalidFusionCardDrop(cardId: string): void {
    const cardName = cardById.get(cardId)?.name ?? cardId;
    editor.setFeedbackMessage(`Solo puedes colocar cartas FUSION en estos slots. Intentaste usar: ${cardName}.`);
  }
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-lg border border-cyan-900/60 bg-[linear-gradient(160deg,rgba(4,12,24,0.92),rgba(2,8,16,0.95))] p-3 shadow-[0_0_20px_rgba(6,182,212,0.18)]">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Seleccionar deck story" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" value={editor.data.deck?.deckListId ?? ""} onChange={(event) => void editor.onSelectDeck(event.target.value)} disabled={editor.isBusy || editor.data.decks.length === 0}>
            {editor.data.decks.map((deck) => <option key={deck.deckListId} value={deck.deckListId}>{deck.name} v{deck.version} {deck.isActive ? "(activo)" : ""}</option>)}
          </select>
          <button type="button" aria-label="Refrescar story decks" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200" onClick={() => void editor.onRefresh()} disabled={editor.isBusy}>Refrescar</button>
          <button type="button" aria-label="Activar o desactivar edición story deck" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100" onClick={() => editor.setIsEditMode(!editor.isEditMode)} disabled={editor.isBusy || !editor.data.deck}>{editor.isEditMode ? "Salir de edición" : "Editar deck"}</button>
          <button type="button" aria-label="Asignar carta seleccionada al slot activo" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase text-slate-100 disabled:opacity-50" disabled={!editor.isEditMode || editor.selectedSlotIndex === null || !editor.selectedCollectionCardId} onClick={() => editor.selectedSlotIndex !== null && editor.selectedCollectionCardId ? editor.setDraftCardIdBySlot(editor.selectedSlotIndex, editor.selectedCollectionCardId) : undefined}>Asignar al slot</button>
          <button type="button" aria-label="Quitar carta del slot story" className="h-9 rounded-md border border-rose-600 px-3 text-xs font-bold uppercase text-rose-200 disabled:opacity-50" disabled={!editor.isEditMode || editor.selectedSlotIndex === null} onClick={() => editor.selectedSlotIndex !== null ? editor.clearSlotCardByIndex(editor.selectedSlotIndex) : undefined}>Quitar</button>
          <button type="button" aria-label="Guardar story deck" className="h-9 rounded-md border border-emerald-500 px-3 text-xs font-bold uppercase text-emerald-200 disabled:opacity-50" onClick={() => void editor.onSave()} disabled={!editor.isEditMode || editor.isBusy || !editor.canSave}>Guardar</button>
          <select aria-label="Seleccionar modo de edición de story deck" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs font-bold uppercase text-slate-100" value={editor.isBaseDeckMode ? "BASE" : "DUEL"} onChange={(event) => editor.setIsBaseDeckMode(event.target.value === "BASE")} disabled={editor.isBusy || !editor.selectedDuelId}>
            <option value="BASE">Modo: Deck base</option>
            <option value="DUEL">Modo: Deck duelo</option>
          </select>
          <select aria-label="Seleccionar duelo origen para clonar" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100 disabled:opacity-50" value={cloneSourceDuelId} onChange={(event) => setCloneSourceDuelId(event.target.value)} disabled={editor.isBusy || editor.isBaseDeckMode || cloneCandidateDuels.length === 0}>
            <option value="">Clonar desde duelo...</option>
            {cloneCandidateDuels.map((duel) => <option key={duel.duelId} value={duel.duelId}>{`Ch${duel.chapter}-${duel.duelIndex}: ${duel.title}`}</option>)}
          </select>
          <button type="button" aria-label="Clonar configuración desde otro duelo" className="h-9 rounded-md border border-violet-500 px-3 text-xs font-bold uppercase text-violet-200 disabled:opacity-50" disabled={editor.isBusy || editor.isBaseDeckMode || (!cloneSourceDuelId && cloneCandidateDuels.length === 0)} onClick={() => editor.cloneFromDuel(cloneSourceDuelId || cloneCandidateDuels[0]?.duelId || "")}>Clonar duelo</button>
          <select aria-label="Seleccionar dificultad del duelo" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100 disabled:opacity-50" value={editor.selectedDuelDifficulty} onChange={(event) => editor.setSelectedDuelDifficulty(event.target.value as typeof editor.selectedDuelDifficulty)} disabled={editor.isBusy || !editor.selectedDuelId || editor.isBaseDeckMode}>
            <option value="ROOKIE">ROOKIE</option>
            <option value="STANDARD">STANDARD</option>
            <option value="ELITE">ELITE</option>
            <option value="BOSS">BOSS</option>
            <option value="MYTHIC">MYTHIC</option>
          </select>
          <select aria-label="Seleccionar estilo IA del duelo" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100 disabled:opacity-50" value={editor.duelAiStyle} onChange={(event) => editor.setDuelAiStyle(event.target.value as typeof editor.duelAiStyle)} disabled={editor.isBusy || !editor.selectedDuelId || editor.isBaseDeckMode}>
            <option value="balanced">Estilo balanced</option>
            <option value="aggressive">Estilo aggressive</option>
            <option value="combo">Estilo combo</option>
            <option value="control">Estilo control</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-slate-200">
            <span className="font-bold uppercase text-cyan-200">Aggro IA</span>
            <input aria-label="Agresión IA del duelo" placeholder="0.00 - 1.00" type="number" min={0} max={1} step={0.01} value={editor.duelAiAggression} onChange={(event) => editor.setDuelAiAggression(Number(event.target.value))} disabled={editor.isBusy || !editor.selectedDuelId || editor.isBaseDeckMode} className="h-9 w-24 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          </label>
          <span className="font-bold uppercase text-cyan-200">Masiva duelo:</span>
          <label className="flex items-center gap-1">Ver
            <input aria-label="Version tier masiva" placeholder="0-5" type="number" min={0} max={5} value={massVersionTier} onChange={(event) => setMassVersionTier(Number(event.target.value))} className="h-9 w-16 rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          </label>
          <label className="flex items-center gap-1">Lvl
            <input aria-label="Level masivo" placeholder="0-30" type="number" min={0} max={30} value={massLevel} onChange={(event) => setMassLevel(Number(event.target.value))} className="h-9 w-16 rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          </label>
          <label className="flex items-center gap-1">XP
            <input aria-label="XP masivo" placeholder="0+" type="number" min={0} value={massXp} onChange={(event) => setMassXp(Number(event.target.value))} className="h-9 w-20 rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          </label>
          <button type="button" aria-label="Aplicar edición masiva de escalado" className="h-9 rounded-md border border-amber-500 px-3 text-xs font-bold uppercase text-amber-200 disabled:opacity-50" disabled={!editor.isEditMode || editor.isBaseDeckMode} onClick={() => editor.applyMassSlotLevels({ versionTier: massVersionTier, level: massLevel, xp: massXp })}>Aplicar a todas</button>
        </div>
        {selectedDeckDuels.length > 0 ? <p className="mt-2 text-xs text-slate-300">Se usa en: {selectedDeckDuels.map((duel) => `Ch${duel.chapter}-${duel.duelIndex}`).join(", ")}</p> : null}
        {editor.feedback ? <p className={`mt-2 rounded-md border px-3 py-2 text-xs font-semibold ${editor.feedback.toLowerCase().includes("no se pudo") ? "border-rose-500/70 bg-rose-900/25 text-rose-100" : "border-emerald-500/70 bg-emerald-900/20 text-emerald-100"}`}>{editor.feedback}</p> : null}
      </div>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[auto_470px_minmax(0,1fr)_360px]">
        {leftPanelMode === "opponents"
          ? <AdminStoryOpponentCatalog opponents={editor.data.opponents} selectedOpponentId={selectedOpponentId} onSelectOpponent={(opponentId) => { void editor.onSelectOpponent(opponentId); setLeftPanelMode("duels"); }} />
          : <AdminStoryDuelCatalog duels={editor.data.duels} selectedDuelId={editor.selectedDuelId} selectedDeckListId={editor.data.deck?.deckListId ?? null} isBusy={editor.isBusy} onBackToOpponents={() => setLeftPanelMode("opponents")} onSelectDuel={(duelId) => void editor.onSelectDuelReference(duelId)} />}
        <div className="flex min-h-0 flex-col justify-start xl:justify-start">
          <AdminStoryDeckSlotsPanel draftCardIds={editor.draftCardIds} draftFusionCardIds={editor.draftFusionCardIds} draftRewardCardIds={editor.draftRewardCardIds} cardById={cardById} selectedSlotIndex={editor.selectedSlotIndex} isEditMode={editor.isEditMode} isBusy={editor.isBusy} isBaseDeckMode={editor.isBaseDeckMode} selectedDuelId={editor.selectedDuelId} onSelectSlot={(slotIndex) => { editor.setSelectedSlotIndex(slotIndex); editor.setSelectedCollectionCardId(null); }} onDropOnSlot={onDropOnSlot} onStartDragSlot={(slotIndex, event) => editor.isEditMode && editor.draftCardIds[slotIndex] ? writeAdminStarterDeckDragData(event, { type: "slot", scope: "DECK", slotIndex }) : undefined} onSetFusionCard={editor.setDraftFusionCardIdBySlot} onSwapFusionCards={editor.swapDraftFusionCards} onClearFusionCard={editor.clearDraftFusionCardBySlot} onSetRewardCard={editor.setDraftRewardCardId} onClearRewardCard={editor.clearDraftRewardCard} onInvalidFusionCardDrop={onInvalidFusionCardDrop} />
        </div>
        <AdminStarterDeckCollectionPanel availableCards={editor.data.availableCards} selectedCardId={editor.selectedCollectionCardId} isEditMode={editor.isEditMode} onSelectCard={(cardId) => { editor.setSelectedCollectionCardId(cardId); editor.setSelectedSlotIndex(null); }} onDropToCollection={(event) => {
          if (!editor.isEditMode) return;
          event.preventDefault();
          const payload = readAdminStarterDeckDragData(event);
          if (payload?.type !== "slot") return;
          const scope = payload.scope ?? "DECK";
          if (scope === "DECK") editor.clearSlotCardByIndex(payload.slotIndex);
          if (scope === "FUSION") editor.clearDraftFusionCardBySlot(payload.slotIndex);
          if (scope === "REWARD") editor.clearDraftRewardCard();
        }} onStartDragCard={(cardId, event) => writeAdminStarterDeckDragData(event, { type: "card", cardId })} />
        <div className="flex min-h-0 flex-col gap-2">
          <HomeCardInspector selectedCard={selectedCard} selectedCardVersionTier={selectedSlotLevels?.versionTier ?? 0} selectedCardLevel={selectedSlotLevels?.level ?? 0} selectedCardXp={selectedSlotLevels?.xp ?? 0} selectedCardMasteryPassiveSkillId={null} minCardScale={0.62} maxCardScale={0.95} />
          <section className="rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 text-xs text-slate-200">
            <p className="font-black uppercase tracking-[0.2em] text-cyan-200">Detalle Escalado</p>
            <p className="mt-1 text-[11px] text-slate-300">Afecta todas las copias de la misma carta dentro del deck del duelo.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="text-[11px] text-slate-300">Version
                <input aria-label="Version del detalle" placeholder="0-5" type="number" min={0} max={5} value={selectedSlotLevels?.versionTier ?? 0} disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode} onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "versionTier", Number(event.target.value)) : undefined} className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
              </label>
              <label className="text-[11px] text-slate-300">Level
                <input aria-label="Level del detalle" placeholder="0-30" type="number" min={0} max={30} value={selectedSlotLevels?.level ?? 0} disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode} onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "level", Number(event.target.value)) : undefined} className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
              </label>
              <label className="text-[11px] text-slate-300">XP
                <input aria-label="XP del detalle" placeholder="0+" type="number" min={0} value={selectedSlotLevels?.xp ?? 0} disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode} onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "xp", Number(event.target.value)) : undefined} className="mt-1 h-8 w-full rounded border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
              </label>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

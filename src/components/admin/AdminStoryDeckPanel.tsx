// src/components/admin/AdminStoryDeckPanel.tsx - Panel principal para administrar mazos Story por oponente con edición visual y guardado seguro.
"use client";
import Image from "next/image";
import { DragEvent, memo, useMemo, useState } from "react";
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

function AdminStoryDeckPanelComponent({ initialData }: IAdminStoryDeckPanelProps) {
  const editor = useAdminStoryDeckEditor(initialData);
  const [leftPanelMode, setLeftPanelMode] = useState<"opponents" | "duels">("opponents");
  const [massVersionTier, setMassVersionTier] = useState(0);
  const [massLevel, setMassLevel] = useState(0);
  const [massXp, setMassXp] = useState(0);
  const [showMassEdit, setShowMassEdit] = useState(false);
  const cardById = useMemo(() => new Map(editor.data.availableCards.map((card) => [card.id, card])), [editor.data.availableCards]);
  const selectedSlotCardId = editor.selectedSlotIndex === null ? null : (editor.draftCardIds[editor.selectedSlotIndex] ?? null);
  const selectedCard = (editor.selectedCollectionCardId ? cardById.get(editor.selectedCollectionCardId) ?? null : null) ?? (selectedSlotCardId ? cardById.get(selectedSlotCardId) ?? null : null);
  const selectedOpponent = useMemo(() => editor.data.opponents.find((opp) => opp.opponentId === editor.selectedOpponentId) ?? null, [editor.data.opponents, editor.selectedOpponentId]);
  const selectedDuel = useMemo(() => editor.data.duels.find((d) => d.duelId === editor.selectedDuelId) ?? null, [editor.data.duels, editor.selectedDuelId]);
  const selectedDeckDuels = editor.data.duels.filter((duel) => duel.deckListId === editor.data.deck?.deckListId);
  const cloneCandidateDuels = editor.data.duels.filter((duel) => duel.duelId !== editor.selectedDuelId);
  const [cloneSourceDuelId, setCloneSourceDuelId] = useState<string>("");
  const selectedSlotLevels = editor.selectedSlotIndex === null ? null : (editor.draftSlotLevels[editor.selectedSlotIndex] ?? null);
  const isDuelMode = !editor.isBaseDeckMode && editor.selectedDuelId !== null;
  const hasErrorFeedback = editor.feedback.toLowerCase().includes("no se pudo");

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
    <section className="flex h-full min-h-0 flex-1 flex-col gap-2.5">

      {/* ── Barra de contexto de oponente ── */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.95),rgba(2,9,20,0.98))] px-4 py-2.5 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_50%,rgba(59,130,246,0.04))]" />
        <div className="relative flex flex-wrap items-center gap-3">
          {/* Identidad oponente */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-800/60 bg-slate-900/80">
              {selectedOpponent?.avatarUrl
                ? <Image src={selectedOpponent.avatarUrl} alt={selectedOpponent.displayName} fill className="object-cover" sizes="40px" />
                : <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-600" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600/80">Oponente activo</p>
              <p className="text-sm font-black uppercase tracking-wide text-cyan-100">
                {selectedOpponent?.displayName ?? "—"}
              </p>
            </div>
          </div>

          <div className="mx-1 hidden h-8 w-px bg-cyan-900/60 sm:block" />

          {/* Deck activo */}
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600/80">Deck</p>
            <select
              aria-label="Seleccionar deck story"
              className="h-7 rounded-md border border-cyan-800/50 bg-slate-950/80 px-2 text-xs font-semibold text-slate-100 focus:border-cyan-500 focus:outline-none"
              value={editor.data.deck?.deckListId ?? ""}
              onChange={(event) => void editor.onSelectDeck(event.target.value)}
              disabled={editor.isBusy || editor.data.decks.length === 0}
            >
              {editor.data.decks.map((deck) => (
                <option key={deck.deckListId} value={deck.deckListId}>
                  {deck.name} v{deck.version} {deck.isActive ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Duelo activo */}
          {isDuelMode && selectedDuel && (
            <>
              <div className="mx-1 hidden h-8 w-px bg-cyan-900/60 sm:block" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600/80">Duelo seleccionado</p>
                <p className="text-xs font-bold text-emerald-300">
                  {`Ch${selectedDuel.chapter}-${selectedDuel.duelIndex}: ${selectedDuel.title}`}
                </p>
              </div>
            </>
          )}

          {/* Modo actual badge */}
          <div className="ml-auto flex items-center gap-2">
            <span className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${isDuelMode ? "border-violet-500/60 bg-violet-950/50 text-violet-300" : "border-cyan-600/50 bg-cyan-950/50 text-cyan-300"}`}>
              {isDuelMode ? "Modo duelo" : "Deck base"}
            </span>
            {editor.data.deck?.isActive && (
              <span className="rounded-md border border-emerald-600/50 bg-emerald-950/50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-400">
                Activo
              </span>
            )}
          </div>
        </div>

        {selectedDeckDuels.length > 0 && (
          <p className="relative mt-1.5 text-[10px] text-slate-400">
            Deck usado en: {selectedDeckDuels.map((d) => `Ch${d.chapter}-${d.duelIndex}`).join(", ")}
          </p>
        )}
      </div>

      {/* ── Toolbar de acciones ── */}
      <div className="rounded-xl border border-slate-700/60 bg-[#040d1a]/80 p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-wrap items-center gap-2">

          {/* Grupo: edición */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-950/50 p-1">
            <button
              type="button"
              aria-label="Refrescar story decks"
              className="flex h-8 items-center gap-1.5 rounded-md border border-cyan-700/50 bg-cyan-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-900/40 disabled:opacity-50"
              onClick={() => void editor.onRefresh()}
              disabled={editor.isBusy}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" /></svg>
              Refrescar
            </button>
            <button
              type="button"
              aria-label="Activar o desactivar edición story deck"
              className={`flex h-8 items-center gap-1.5 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${editor.isEditMode ? "border-amber-500/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/40" : "border-slate-600/60 bg-slate-900/50 text-slate-200 hover:border-cyan-600/50 hover:text-cyan-300"}`}
              onClick={() => editor.setIsEditMode(!editor.isEditMode)}
              disabled={editor.isBusy || !editor.data.deck}
            >
              {editor.isEditMode
                ? <><svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>Salir</>
                : <><svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>Editar deck</>}
            </button>
            <button
              type="button"
              aria-label="Guardar story deck"
              className="flex h-8 items-center gap-1.5 rounded-md border border-emerald-500/70 bg-emerald-950/50 px-4 text-[10px] font-black uppercase tracking-wider text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)] transition hover:bg-emerald-900/50 hover:shadow-[0_0_14px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              onClick={() => void editor.onSave()}
              disabled={!editor.isEditMode || editor.isBusy || !editor.canSave}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Guardar
            </button>
          </div>

          {/* Grupo: acciones de slot */}
          {editor.isEditMode && (
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-slate-950/50 p-1">
              <button
                type="button"
                aria-label="Asignar carta seleccionada al slot activo"
                className="h-8 rounded-md border border-slate-600/50 bg-slate-900/50 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-cyan-600/50 hover:text-cyan-300 disabled:opacity-40"
                disabled={editor.selectedSlotIndex === null || !editor.selectedCollectionCardId}
                onClick={() => editor.selectedSlotIndex !== null && editor.selectedCollectionCardId ? editor.setDraftCardIdBySlot(editor.selectedSlotIndex, editor.selectedCollectionCardId) : undefined}
              >
                ↓ Asignar slot
              </button>
              <button
                type="button"
                aria-label="Quitar carta del slot story"
                className="h-8 rounded-md border border-rose-700/50 bg-rose-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-rose-300 transition hover:bg-rose-900/40 disabled:opacity-40"
                disabled={editor.selectedSlotIndex === null}
                onClick={() => editor.selectedSlotIndex !== null ? editor.clearSlotCardByIndex(editor.selectedSlotIndex) : undefined}
              >
                ✕ Quitar
              </button>
            </div>
          )}

          {/* Grupo: modo deck */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-950/50 p-1">
            <button
              type="button"
              aria-label="Cambiar a modo deck base"
              className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${editor.isBaseDeckMode ? "border-cyan-500/60 bg-cyan-950/50 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              disabled={editor.isBusy}
              onClick={() => editor.setIsBaseDeckMode(true)}
            >
              Base
            </button>
            <button
              type="button"
              aria-label="Cambiar a modo duelo"
              className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${!editor.isBaseDeckMode ? "border-violet-500/60 bg-violet-950/50 text-violet-300" : "border-transparent text-slate-400 hover:text-slate-200"}`}
              disabled={editor.isBusy || !editor.selectedDuelId}
              onClick={() => editor.setIsBaseDeckMode(false)}
            >
              Duelo
            </button>
          </div>

          {/* Grupo: config de duelo */}
          {isDuelMode && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-violet-900/40 bg-violet-950/20 p-1.5">
              <select
                aria-label="Seleccionar dificultad del duelo"
                className="h-8 rounded-md border border-slate-600/50 bg-slate-950/80 px-2 text-[10px] font-bold uppercase text-slate-100 focus:outline-none disabled:opacity-50"
                value={editor.selectedDuelDifficulty}
                onChange={(event) => editor.setSelectedDuelDifficulty(event.target.value as typeof editor.selectedDuelDifficulty)}
                disabled={editor.isBusy}
              >
                <option value="ROOKIE">Rookie</option>
                <option value="STANDARD">Standard</option>
                <option value="ELITE">Elite</option>
                <option value="BOSS">Boss</option>
                <option value="MYTHIC">Mythic</option>
              </select>
              <select
                aria-label="Seleccionar estilo IA del duelo"
                className="h-8 rounded-md border border-slate-600/50 bg-slate-950/80 px-2 text-[10px] font-bold uppercase text-slate-100 focus:outline-none disabled:opacity-50"
                value={editor.duelAiStyle}
                onChange={(event) => editor.setDuelAiStyle(event.target.value as typeof editor.duelAiStyle)}
                disabled={editor.isBusy}
              >
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
                <option value="combo">Combo</option>
                <option value="control">Control</option>
              </select>
              <label className="flex h-8 items-center gap-1.5 rounded-md border border-slate-600/50 bg-slate-950/60 px-2 text-[10px] font-bold uppercase text-slate-300">
                Aggro
                <input
                  aria-label="Agresión IA del duelo"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={editor.duelAiAggression}
                  onChange={(event) => editor.setDuelAiAggression(Number(event.target.value))}
                  disabled={editor.isBusy}
                  className="w-14 bg-transparent text-right text-[10px] text-slate-100 outline-none"
                />
              </label>
              <button
                type="button"
                aria-label="Mostrar u ocultar edición masiva"
                className={`h-8 rounded-md border px-3 text-[10px] font-bold uppercase tracking-wider transition ${showMassEdit ? "border-amber-500/60 bg-amber-950/40 text-amber-300" : "border-slate-600/50 bg-slate-900/50 text-slate-300 hover:text-amber-300"}`}
                disabled={!editor.isEditMode}
                onClick={() => setShowMassEdit((s) => !s)}
              >
                Masiva
              </button>
            </div>
          )}

          {/* Clone + Mass edit expandible */}
          {isDuelMode && editor.isEditMode && showMassEdit && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-amber-900/30 bg-amber-950/10 p-1.5">
              <select
                aria-label="Seleccionar duelo origen para clonar"
                className="h-8 rounded-md border border-slate-600/50 bg-slate-950/80 px-2 text-[10px] text-slate-100 focus:outline-none disabled:opacity-50"
                value={cloneSourceDuelId}
                onChange={(event) => setCloneSourceDuelId(event.target.value)}
                disabled={editor.isBusy || cloneCandidateDuels.length === 0}
              >
                <option value="">Clonar desde...</option>
                {cloneCandidateDuels.map((duel) => (
                  <option key={duel.duelId} value={duel.duelId}>{`Ch${duel.chapter}-${duel.duelIndex}: ${duel.title}`}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Clonar configuración desde otro duelo"
                className="h-8 rounded-md border border-violet-500/60 bg-violet-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-violet-300 transition hover:bg-violet-900/40 disabled:opacity-40"
                disabled={editor.isBusy || (!cloneSourceDuelId && cloneCandidateDuels.length === 0)}
                onClick={() => editor.cloneFromDuel(cloneSourceDuelId || cloneCandidateDuels[0]?.duelId || "")}
              >
                Clonar duelo
              </button>
              <span className="text-[10px] font-bold uppercase text-amber-400/80">Masiva:</span>
              <label className="flex h-8 items-center gap-1 rounded-md border border-slate-600/50 bg-slate-950/60 px-2 text-[10px] text-slate-300">
                Ver
                <input aria-label="Version tier masiva" type="number" min={0} max={5} value={massVersionTier} onChange={(event) => setMassVersionTier(Number(event.target.value))} className="w-10 bg-transparent text-right text-[10px] text-slate-100 outline-none" />
              </label>
              <label className="flex h-8 items-center gap-1 rounded-md border border-slate-600/50 bg-slate-950/60 px-2 text-[10px] text-slate-300">
                Lvl
                <input aria-label="Level masivo" type="number" min={0} max={30} value={massLevel} onChange={(event) => setMassLevel(Number(event.target.value))} className="w-10 bg-transparent text-right text-[10px] text-slate-100 outline-none" />
              </label>
              <label className="flex h-8 items-center gap-1 rounded-md border border-slate-600/50 bg-slate-950/60 px-2 text-[10px] text-slate-300">
                XP
                <input aria-label="XP masivo" type="number" min={0} value={massXp} onChange={(event) => setMassXp(Number(event.target.value))} className="w-12 bg-transparent text-right text-[10px] text-slate-100 outline-none" />
              </label>
              <button
                type="button"
                aria-label="Aplicar edición masiva de escalado"
                className="h-8 rounded-md border border-amber-500/60 bg-amber-950/40 px-3 text-[10px] font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-900/40"
                onClick={() => editor.applyMassSlotLevels({ versionTier: massVersionTier, level: massLevel, xp: massXp })}
              >
                Aplicar todas
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {editor.feedback ? (
          <p className={`mt-2 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${hasErrorFeedback ? "border-rose-500/60 bg-rose-950/30 text-rose-200" : "border-emerald-500/60 bg-emerald-950/30 text-emerald-200"}`}>
            {editor.feedback}
          </p>
        ) : null}
      </div>

      {/* ── Contenido principal ── */}
      <div className="grid min-h-0 flex-1 gap-2.5 xl:grid-cols-[auto_470px_minmax(0,1fr)_360px]">
        {leftPanelMode === "opponents"
          ? <AdminStoryOpponentCatalog
              opponents={editor.data.opponents}
              selectedOpponentId={editor.selectedOpponentId}
              onSelectOpponent={(opponentId) => {
                void editor.onSelectOpponent(opponentId);
                setLeftPanelMode("duels");
              }}
            />
          : <AdminStoryDuelCatalog
              duels={editor.data.duels}
              selectedDuelId={editor.selectedDuelId}
              selectedDeckListId={editor.data.deck?.deckListId ?? null}
              selectedOpponentName={selectedOpponent?.displayName ?? null}
              isBusy={editor.isBusy}
              onBackToOpponents={() => setLeftPanelMode("opponents")}
              onSelectDuel={(duelId) => void editor.onSelectDuelReference(duelId)}
            />}

        <div className="flex min-h-0 flex-col justify-start xl:justify-start">
          <AdminStoryDeckSlotsPanel
            draftCardIds={editor.draftCardIds}
            draftFusionCardIds={editor.draftFusionCardIds}
            draftRewardCardIds={editor.draftRewardCardIds}
            cardById={cardById}
            selectedSlotIndex={editor.selectedSlotIndex}
            isEditMode={editor.isEditMode}
            isBusy={editor.isBusy}
            isBaseDeckMode={editor.isBaseDeckMode}
            selectedDuelId={editor.selectedDuelId}
            onSelectSlot={(slotIndex) => {
              editor.setSelectedSlotIndex(slotIndex);
              editor.setSelectedCollectionCardId(null);
            }}
            onDropOnSlot={onDropOnSlot}
            onStartDragSlot={(slotIndex, event) =>
              editor.isEditMode && editor.draftCardIds[slotIndex]
                ? writeAdminStarterDeckDragData(event, { type: "slot", scope: "DECK", slotIndex })
                : undefined
            }
            onSetFusionCard={editor.setDraftFusionCardIdBySlot}
            onSwapFusionCards={editor.swapDraftFusionCards}
            onClearFusionCard={editor.clearDraftFusionCardBySlot}
            onSetRewardCard={editor.setDraftRewardCardId}
            onClearRewardCard={editor.clearDraftRewardCard}
            onInvalidFusionCardDrop={onInvalidFusionCardDrop}
          />
        </div>

        <AdminStarterDeckCollectionPanel
          availableCards={editor.data.availableCards}
          selectedCardId={editor.selectedCollectionCardId}
          isEditMode={editor.isEditMode}
          onSelectCard={(cardId) => {
            editor.setSelectedCollectionCardId(cardId);
            editor.setSelectedSlotIndex(null);
          }}
          onDropToCollection={(event) => {
            if (!editor.isEditMode) return;
            event.preventDefault();
            const payload = readAdminStarterDeckDragData(event);
            if (payload?.type !== "slot") return;
            const scope = payload.scope ?? "DECK";
            if (scope === "DECK") editor.clearSlotCardByIndex(payload.slotIndex);
            if (scope === "FUSION") editor.clearDraftFusionCardBySlot(payload.slotIndex);
            if (scope === "REWARD") editor.clearDraftRewardCard();
          }}
          onStartDragCard={(cardId, event) => writeAdminStarterDeckDragData(event, { type: "card", cardId })}
        />

        <div className="flex min-h-0 flex-col gap-2">
          <HomeCardInspector
            selectedCard={selectedCard}
            selectedCardVersionTier={selectedSlotLevels?.versionTier ?? 0}
            selectedCardLevel={selectedSlotLevels?.level ?? 0}
            selectedCardXp={selectedSlotLevels?.xp ?? 0}
            selectedCardMasteryPassiveSkillId={null}
            minCardScale={0.62}
            maxCardScale={0.95}
          />
          <section className="rounded-xl border border-cyan-800/30 bg-[#031020]/55 p-3 text-xs text-slate-200">
            <p className="font-black uppercase tracking-[0.18em] text-cyan-300">Escalado Slot</p>
            <p className="mt-1 text-[10px] text-slate-400">Afecta todas las copias de la misma carta en este deck.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <label className="text-[10px] text-slate-400">
                Ver
                <input
                  aria-label="Version del detalle"
                  type="number"
                  min={0}
                  max={5}
                  value={selectedSlotLevels?.versionTier ?? 0}
                  disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode}
                  onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "versionTier", Number(event.target.value)) : undefined}
                  className="mt-1 h-8 w-full rounded-md border border-slate-700/60 bg-slate-950/80 px-2 text-xs text-slate-100 focus:border-cyan-600 focus:outline-none"
                />
              </label>
              <label className="text-[10px] text-slate-400">
                Lvl
                <input
                  aria-label="Level del detalle"
                  type="number"
                  min={0}
                  max={30}
                  value={selectedSlotLevels?.level ?? 0}
                  disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode}
                  onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "level", Number(event.target.value)) : undefined}
                  className="mt-1 h-8 w-full rounded-md border border-slate-700/60 bg-slate-950/80 px-2 text-xs text-slate-100 focus:border-cyan-600 focus:outline-none"
                />
              </label>
              <label className="text-[10px] text-slate-400">
                XP
                <input
                  aria-label="XP del detalle"
                  type="number"
                  min={0}
                  value={selectedSlotLevels?.xp ?? 0}
                  disabled={editor.selectedSlotIndex === null || editor.isBaseDeckMode}
                  onChange={(event) => editor.selectedSlotIndex !== null ? editor.setDraftSlotLevelByIndex(editor.selectedSlotIndex, "xp", Number(event.target.value)) : undefined}
                  className="mt-1 h-8 w-full rounded-md border border-slate-700/60 bg-slate-950/80 px-2 text-xs text-slate-100 focus:border-cyan-600 focus:outline-none"
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export const AdminStoryDeckPanel = memo(AdminStoryDeckPanelComponent);

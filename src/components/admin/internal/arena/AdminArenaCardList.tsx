// src/components/admin/internal/arena/AdminArenaCardList.tsx - Cuadrícula de cartas de un mazo de arena; al clicar una abre el diálogo para editar versión/nivel.
"use client";

import { useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { AdminArenaCardDialog } from "@/components/admin/internal/arena/AdminArenaCardDialog";

interface IAdminArenaCardListProps {
  title: string;
  cards: IAdminArenaCardEntry[];
  validCards: ICard[];
  onChange: (cards: IAdminArenaCardEntry[]) => void;
}

export function AdminArenaCardList({ title, cards, validCards, onChange }: IAdminArenaCardListProps) {
  const cardById = useMemo(() => new Map(validCards.map((card) => [card.id, card])), [validCards]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const updateCard = (index: number, patch: Partial<IAdminArenaCardEntry>) =>
    onChange(cards.map((card, current) => (current === index ? { ...card, ...patch } : card)));
  const removeCard = (index: number) => {
    onChange(cards.filter((_, current) => current !== index));
    setEditingIndex(null);
  };
  const addCard = () => {
    onChange([...cards, { cardId: validCards[0]?.id ?? "", versionTier: null, level: null, xp: null, attackBonus: null, defenseBonus: null }]);
    setEditingIndex(cards.length);
  };

  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-950/40 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{title} ({cards.length})</p>
        <button type="button" aria-label={`Añadir carta a ${title}`} className="h-6 rounded border border-cyan-600/50 px-2 text-[10px] font-bold uppercase text-cyan-200 hover:bg-cyan-900/40" onClick={addCard}>+ Carta</button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
        {cards.map((card, index) => {
          const resolved = cardById.get(card.cardId);
          const hasOverride = card.versionTier !== null || card.level !== null || card.xp !== null || (card.attackBonus ?? 0) > 0 || (card.defenseBonus ?? 0) > 0;
          return (
            <button key={index} type="button" aria-label={`Editar ${resolved?.name ?? card.cardId}`} className="group relative aspect-[13/19] rounded transition hover:ring-2 hover:ring-cyan-400" onClick={() => setEditingIndex(index)}>
              {resolved ? <CardThumbnail card={resolved} versionTier={card.versionTier ?? 0} level={card.level ?? undefined} xp={card.xp ?? 0} /> : <div className="h-full w-full rounded border border-dashed border-slate-700" />}
              {hasOverride ? <span aria-hidden className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_6px_rgba(232,121,249,0.8)]" /> : null}
            </button>
          );
        })}
      </div>
      {editingIndex !== null && cards[editingIndex] ? (
        <AdminArenaCardDialog
          entry={cards[editingIndex]}
          validCards={validCards}
          onChange={(patch) => updateCard(editingIndex, patch)}
          onRemove={() => removeCard(editingIndex)}
          onClose={() => setEditingIndex(null)}
        />
      ) : null}
    </div>
  );
}

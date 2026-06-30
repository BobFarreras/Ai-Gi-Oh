// src/components/admin/internal/arena/AdminArenaCardList.tsx - Editor de las cartas de un mazo de variante: miniatura real + selector + overrides version/level/xp por carta.
"use client";

import { useMemo } from "react";
import { ICard } from "@/core/entities/ICard";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";

interface IAdminArenaCardListProps {
  title: string;
  cards: IAdminArenaCardEntry[];
  validCards: ICard[];
  onChange: (cards: IAdminArenaCardEntry[]) => void;
}

/** Convierte el input de texto en número u null (vacío = usa el escalado del tier/dificultad). */
function parseOverride(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const NUMBER_INPUT = "h-7 w-11 rounded border border-slate-600 bg-slate-950/70 px-1 text-[11px] text-slate-100";

export function AdminArenaCardList({ title, cards, validCards, onChange }: IAdminArenaCardListProps) {
  const cardById = useMemo(() => new Map(validCards.map((card) => [card.id, card])), [validCards]);
  const sortedOptions = useMemo(() => [...validCards].sort((a, b) => a.name.localeCompare(b.name)), [validCards]);

  const updateCard = (index: number, patch: Partial<IAdminArenaCardEntry>) =>
    onChange(cards.map((card, current) => (current === index ? { ...card, ...patch } : card)));
  const removeCard = (index: number) => onChange(cards.filter((_, current) => current !== index));
  const addCard = () => onChange([...cards, { cardId: validCards[0]?.id ?? "", versionTier: null, level: null, xp: null }]);

  return (
    <div className="rounded-md border border-slate-700/60 bg-slate-950/40 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{title} ({cards.length})</p>
        <button type="button" aria-label={`Añadir carta a ${title}`} className="h-6 rounded border border-cyan-600/50 px-2 text-[10px] font-bold uppercase text-cyan-200 hover:bg-cyan-900/40" onClick={addCard}>+ Carta</button>
      </div>
      <ul className="space-y-1.5">
        {cards.map((card, index) => {
          const resolved = cardById.get(card.cardId);
          return (
            <li key={index} className="flex items-center gap-1.5">
              <div className="aspect-[13/19] w-11 shrink-0">
                {resolved ? <CardThumbnail card={resolved} versionTier={card.versionTier ?? 0} level={card.level ?? undefined} xp={card.xp ?? 0} /> : <div className="h-full w-full rounded border border-dashed border-slate-700" />}
              </div>
              <select aria-label="Carta" className="h-7 min-w-0 flex-1 rounded border border-slate-600 bg-slate-950/70 px-1 text-[11px] text-slate-100" value={card.cardId} onChange={(event) => updateCard(index, { cardId: event.target.value })}>
                {sortedOptions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
              <input aria-label="Versión" title="Versión (vacío = del tier)" className={NUMBER_INPUT} placeholder="V" inputMode="numeric" value={card.versionTier ?? ""} onChange={(event) => updateCard(index, { versionTier: parseOverride(event.target.value) })} />
              <input aria-label="Nivel" title="Nivel (vacío = del tier)" className={NUMBER_INPUT} placeholder="Lv" inputMode="numeric" value={card.level ?? ""} onChange={(event) => updateCard(index, { level: parseOverride(event.target.value) })} />
              <input aria-label="XP" title="XP (vacío = del tier)" className={NUMBER_INPUT} placeholder="XP" inputMode="numeric" value={card.xp ?? ""} onChange={(event) => updateCard(index, { xp: parseOverride(event.target.value) })} />
              <button type="button" aria-label="Quitar carta" className="h-7 w-7 shrink-0 rounded border border-rose-700/50 text-[12px] text-rose-300 hover:bg-rose-900/40" onClick={() => removeCard(index)}>×</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

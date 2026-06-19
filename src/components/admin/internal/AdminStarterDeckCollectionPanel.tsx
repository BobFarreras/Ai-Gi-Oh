// src/components/admin/internal/AdminStarterDeckCollectionPanel.tsx - Panel derecho de almacén para seleccionar y arrastrar cartas al starter deck.
"use client";

import { DragEvent, memo, useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";

interface IAdminStarterDeckCollectionPanelProps {
  availableCards: ICard[];
  selectedCardId: string | null;
  isEditMode: boolean;
  onSelectCard: (cardId: string) => void;
  onDropToCollection: (event: DragEvent<HTMLElement>) => void;
  onStartDragCard: (cardId: string, event: DragEvent<HTMLElement>) => void;
}

const TYPE_OPTIONS: { value: ICard["type"] | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "ENTITY", label: "Entity" },
  { value: "EXECUTION", label: "Exec." },
  { value: "TRAP", label: "Trap" },
  { value: "FUSION", label: "Fusion" },
  { value: "ENVIRONMENT", label: "Env." },
];

function AdminStarterDeckCollectionPanelComponent({
  availableCards,
  selectedCardId,
  isEditMode,
  onSelectCard,
  onDropToCollection,
  onStartDragCard,
}: IAdminStarterDeckCollectionPanelProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ICard["type"] | "ALL">("ALL");

  const filteredCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return availableCards.filter((card) => {
      const matchesType = typeFilter === "ALL" || card.type === typeFilter;
      const matchesText = normalized.length === 0 || card.name.toLowerCase().includes(normalized) || card.id.toLowerCase().includes(normalized);
      return matchesType && matchesText;
    });
  }, [availableCards, query, typeFilter]);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/30 bg-[#031020]/55 p-3 shadow-[0_0_16px_rgba(6,182,212,0.08)]">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">Almacén</h2>
        <span className="rounded border border-cyan-900/50 bg-slate-950/60 px-2 py-0.5 text-[10px] font-bold text-cyan-500">
          {filteredCards.length}
        </span>
      </div>

      <div className="mb-2.5 flex flex-col gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-[#020a14]/80 px-3 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] focus-within:border-cyan-400/50">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 fill-none stroke-cyan-500" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="search"
            aria-label="Buscar carta en almacén admin"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar carta..."
            className="w-full bg-transparent text-[11px] text-cyan-50 placeholder:text-cyan-100/30 outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={`Filtrar por tipo ${opt.label}`}
              onClick={() => setTypeFilter(opt.value)}
              className={`rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition ${typeFilter === opt.value ? "border-cyan-500/60 bg-cyan-950/60 text-cyan-300" : "border-slate-700/50 bg-slate-900/50 text-slate-400 hover:border-cyan-700/50 hover:text-cyan-400"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1"
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDropToCollection}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] justify-items-center gap-3 pb-4">
          {filteredCards.map((card) => (
            <button
              key={card.id}
              type="button"
              aria-label={`Seleccionar ${card.name}`}
              onClick={() => onSelectCard(card.id)}
              className="relative flex w-[84px] flex-col items-center"
            >
              <HomeMiniCard
                card={card}
                label={`Carta ${card.name}`}
                isSelected={selectedCardId === card.id}
                isDraggable={isEditMode}
                onDragStart={(event) => onStartDragCard(card.id, event)}
                showSlotContainer={false}
              />
            </button>
          ))}
          {filteredCards.length === 0 && (
            <p className="col-span-full mt-6 text-center text-xs text-slate-500">Sin resultados</p>
          )}
        </div>
      </div>
    </section>
  );
}

export const AdminStarterDeckCollectionPanel = memo(AdminStarterDeckCollectionPanelComponent);

// src/components/admin/internal/AdminStarterDeckCollectionPanel.tsx - Panel derecho de almacén para seleccionar y arrastrar cartas al starter deck.
"use client";

import { DragEvent, useMemo, useState } from "react";
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

export function AdminStarterDeckCollectionPanel({
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
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-cyan-800/35 bg-[#031020]/50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Almacén</h2>
        <span className="text-xs text-cyan-100/70">{filteredCards.length} cartas</span>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <input
          type="search"
          aria-label="Buscar carta en almacén admin"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o id..."
          className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100"
        />
        <select
          aria-label="Filtrar cartas por tipo"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as ICard["type"] | "ALL")}
          className="rounded-md border border-slate-600 bg-slate-900 p-2 text-xs font-semibold text-slate-100"
        >
          <option value="ALL">Todos</option>
          <option value="ENTITY">Entity</option>
          <option value="EXECUTION">Execution</option>
          <option value="TRAP">Trap</option>
          <option value="FUSION">Fusion</option>
          <option value="ENVIRONMENT">Environment</option>
        </select>
      </div>
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-2" onDragOver={(event) => event.preventDefault()} onDrop={onDropToCollection}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-3 justify-items-center pb-4">
          {filteredCards.map((card) => (
            <button key={card.id} type="button" aria-label={`Seleccionar ${card.name}`} onClick={() => onSelectCard(card.id)} className="relative flex w-[84px] flex-col items-center">
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
        </div>
      </div>
    </section>
  );
}
